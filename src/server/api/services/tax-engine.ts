import { Country, State } from "country-state-city";

export interface TaxInput {
	sellerCountry: string; // ISO 2-letter, e.g. "IN", "US", "GB"
	sellerState?: string; // State code, e.g. "MH", "CA", "NY"
	buyerCountry: string; // ISO 2-letter
	buyerState?: string;
	subtotal: number; // in cents or paise
	customRatePercent?: number; // optional manual override
	isB2B?: boolean; // whether buyer is a registered business
	isReverseCharge?: boolean; // explicit reverse charge flag
	taxNumber?: string; // e.g. GSTIN or EU VAT number
}

export interface TaxLine {
	name: string;
	rate: number; // percent, e.g. 9 for 9%
	amount: number; // in cents or paise
}

export interface TaxCalculationResult {
	sellerCountry: string;
	buyerCountry: string;
	sellerState?: string;
	buyerState?: string;
	taxType: "GST" | "VAT" | "SALES_TAX" | "CUSTOM" | "ZERO_RATED" | "EXEMPT";
	totalTaxPercent: number;
	totalTaxAmount: number;
	subtotal: number;
	totalWithTax: number;
	isReverseCharge: boolean;
	breakdown: TaxLine[];
	notes?: string;
}

const EU_COUNTRIES = new Set([
	"AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
	"DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
	"PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

const EU_VAT_RATES: Record<string, number> = {
	DE: 19,
	FR: 20,
	IT: 22,
	ES: 21,
	NL: 21,
	BE: 21,
	IE: 23,
	AT: 20,
	SE: 25,
	PL: 23,
	DK: 25,
	PT: 23,
	FI: 25.5,
	GR: 24,
	CZ: 21,
	RO: 19,
	HU: 27,
};

const US_STATE_SALES_TAX: Record<string, number> = {
	CA: 7.25,
	NY: 4.0,
	TX: 6.25,
	WA: 6.5,
	FL: 6.0,
	IL: 6.25,
	PA: 6.0,
	OH: 5.75,
	GA: 4.0,
	NC: 4.75,
	MI: 6.0,
	NJ: 6.625,
	VA: 5.3,
	AZ: 5.6,
	MA: 6.25,
	TN: 7.0,
	IN: 7.0,
	MD: 6.0,
	WI: 5.0,
	CO: 2.9,
	MN: 6.875,
	SC: 6.0,
	AL: 4.0,
	LA: 4.45,
	KY: 6.0,
	OR: 0.0,
	MT: 0.0,
	NH: 0.0,
	DE: 0.0,
	AK: 0.0,
};

export function calculateRegionalTax(input: TaxInput): TaxCalculationResult {
	const sellerCountry = (input.sellerCountry || "IN").toUpperCase().trim();
	const buyerCountry = (input.buyerCountry || sellerCountry).toUpperCase().trim();
	const sellerState = input.sellerState ? input.sellerState.toUpperCase().trim() : undefined;
	const buyerState = input.buyerState ? input.buyerState.toUpperCase().trim() : undefined;
	const subtotal = Math.max(0, input.subtotal);

	// 1. Explicit Custom Rate Override
	if (typeof input.customRatePercent === "number" && input.customRatePercent >= 0) {
		const rate = input.customRatePercent;
		const taxAmount = Math.round((subtotal * rate) / 100);
		return {
			sellerCountry,
			buyerCountry,
			sellerState,
			buyerState,
			taxType: rate === 0 ? "ZERO_RATED" : "CUSTOM",
			totalTaxPercent: rate,
			totalTaxAmount: taxAmount,
			subtotal,
			totalWithTax: subtotal + taxAmount,
			isReverseCharge: !!input.isReverseCharge,
			breakdown: [
				{
					name: `Tax (${rate}%)`,
					rate,
					amount: taxAmount,
				},
			],
		};
	}

	// 2. INDIA GST REGIME
	if (sellerCountry === "IN") {
		// International Export: Zero-rated / LUT
		if (buyerCountry !== "IN") {
			return {
				sellerCountry,
				buyerCountry,
				sellerState,
				buyerState,
				taxType: "ZERO_RATED",
				totalTaxPercent: 0,
				totalTaxAmount: 0,
				subtotal,
				totalWithTax: subtotal,
				isReverseCharge: false,
				breakdown: [
					{
						name: "Export with LUT / Zero-Rated GST (0%)",
						rate: 0,
						amount: 0,
					},
				],
				notes: "Zero-rated export of services/goods under Letter of Undertaking (LUT)",
			};
		}

		// Domestic India Transaction
		const standardGstRate = 18; // 18% standard business services GST
		const isIntraState = sellerState && buyerState && sellerState === buyerState;
		const isReverseCharge = !!input.isReverseCharge;

		if (isIntraState) {
			// CGST (9%) + SGST (9%)
			const halfRate = standardGstRate / 2;
			const cgstAmount = Math.round((subtotal * halfRate) / 100);
			const sgstAmount = Math.round((subtotal * halfRate) / 100);
			const totalTaxAmount = cgstAmount + sgstAmount;

			return {
				sellerCountry,
				buyerCountry,
				sellerState,
				buyerState,
				taxType: "GST",
				totalTaxPercent: standardGstRate,
				totalTaxAmount: isReverseCharge ? 0 : totalTaxAmount,
				subtotal,
				totalWithTax: isReverseCharge ? subtotal : subtotal + totalTaxAmount,
				isReverseCharge,
				breakdown: [
					{
						name: `CGST (${halfRate}%)`,
						rate: halfRate,
						amount: cgstAmount,
					},
					{
						name: `SGST (${halfRate}%)`,
						rate: halfRate,
						amount: sgstAmount,
					},
				],
				notes: isReverseCharge
					? "Reverse Charge Mechanism (RCM) applies: Tax payable by recipient"
					: "Intra-state supply subject to CGST + SGST",
			};
		}

		// Inter-state: IGST (18%)
		const igstAmount = Math.round((subtotal * standardGstRate) / 100);
		return {
			sellerCountry,
			buyerCountry,
			sellerState,
			buyerState,
			taxType: "GST",
			totalTaxPercent: standardGstRate,
			totalTaxAmount: isReverseCharge ? 0 : igstAmount,
			subtotal,
			totalWithTax: isReverseCharge ? subtotal : subtotal + igstAmount,
			isReverseCharge,
			breakdown: [
				{
					name: `IGST (${standardGstRate}%)`,
					rate: standardGstRate,
					amount: igstAmount,
				},
			],
			notes: isReverseCharge
				? "Reverse Charge Mechanism (RCM) applies: Tax payable by recipient"
				: "Inter-state supply subject to Integrated GST (IGST)",
		};
	}

	// 3. UNITED KINGDOM (VAT)
	if (sellerCountry === "GB") {
		if (buyerCountry === "GB") {
			const vatRate = 20;
			const taxAmount = Math.round((subtotal * vatRate) / 100);
			return {
				sellerCountry,
				buyerCountry,
				sellerState,
				buyerState,
				taxType: "VAT",
				totalTaxPercent: vatRate,
				totalTaxAmount: taxAmount,
				subtotal,
				totalWithTax: subtotal + taxAmount,
				isReverseCharge: false,
				breakdown: [
					{
						name: `UK Standard VAT (${vatRate}%)`,
						rate: vatRate,
						amount: taxAmount,
					},
				],
			};
		}
		// UK Export outside GB
		return {
			sellerCountry,
			buyerCountry,
			taxType: "ZERO_RATED",
			totalTaxPercent: 0,
			totalTaxAmount: 0,
			subtotal,
			totalWithTax: subtotal,
			isReverseCharge: false,
			breakdown: [{ name: "Zero-Rated UK Export (0%)", rate: 0, amount: 0 }],
		};
	}

	// 4. EUROPEAN UNION (VAT)
	if (EU_COUNTRIES.has(sellerCountry)) {
		// Intra-EU B2B Reverse Charge
		if (EU_COUNTRIES.has(buyerCountry) && sellerCountry !== buyerCountry && input.isB2B) {
			return {
				sellerCountry,
				buyerCountry,
				taxType: "VAT",
				totalTaxPercent: 0,
				totalTaxAmount: 0,
				subtotal,
				totalWithTax: subtotal,
				isReverseCharge: true,
				breakdown: [
					{
						name: "EU Intra-Community Reverse Charge (0%)",
						rate: 0,
						amount: 0,
					},
				],
				notes: "B2B Reverse Charge: VAT to be accounted for by the recipient under EU Directive",
			};
		}

		// Domestic EU or B2C
		const vatCountry = EU_COUNTRIES.has(buyerCountry) ? buyerCountry : sellerCountry;
		const vatRate = EU_VAT_RATES[vatCountry] || 20;
		const taxAmount = Math.round((subtotal * vatRate) / 100);

		return {
			sellerCountry,
			buyerCountry,
			taxType: "VAT",
			totalTaxPercent: vatRate,
			totalTaxAmount: taxAmount,
			subtotal,
			totalWithTax: subtotal + taxAmount,
			isReverseCharge: false,
			breakdown: [
				{
					name: `${vatCountry} Standard VAT (${vatRate}%)`,
					rate: vatRate,
					amount: taxAmount,
				},
			],
		};
	}

	// 5. UNITED STATES (SALES TAX)
	if (sellerCountry === "US" || buyerCountry === "US") {
		const targetState = buyerState || sellerState || "CA";
		const stateRate = US_STATE_SALES_TAX[targetState] ?? 5.0;
		const taxAmount = Math.round((subtotal * stateRate) / 100);

		return {
			sellerCountry,
			buyerCountry,
			sellerState,
			buyerState: targetState,
			taxType: "SALES_TAX",
			totalTaxPercent: stateRate,
			totalTaxAmount: taxAmount,
			subtotal,
			totalWithTax: subtotal + taxAmount,
			isReverseCharge: false,
			breakdown: [
				{
					name: `${targetState} State Sales Tax (${stateRate}%)`,
					rate: stateRate,
					amount: taxAmount,
				},
			],
		};
	}

	// 6. DEFAULT / REST OF WORLD
	return {
		sellerCountry,
		buyerCountry,
		taxType: "ZERO_RATED",
		totalTaxPercent: 0,
		totalTaxAmount: 0,
		subtotal,
		totalWithTax: subtotal,
		isReverseCharge: false,
		breakdown: [
			{
				name: "Standard International (0%)",
				rate: 0,
				amount: 0,
			},
		],
	};
}

export function listSupportedCountries() {
	return Country.getAllCountries().map((c) => ({
		isoCode: c.isoCode,
		name: c.name,
		phonecode: c.phonecode,
		currency: c.currency,
	}));
}

export function listStatesForCountry(countryCode: string) {
	return State.getStatesOfCountry(countryCode.toUpperCase()).map((s) => ({
		isoCode: s.isoCode,
		name: s.name,
	}));
}

