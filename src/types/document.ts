export type TaxType =
	| "none"
	| "GST (India)"
	| "VAT"
	| "PPN"
	| "SST"
	| "HST"
	| "TAX"
	| string;
export type GstType = "IGST" | "CGST & SGST";
export type DiscountType = "none" | "total" | "item";

export interface DocumentData {
	logoUrl?: string;
	companyId?: string;
	contactEmail?: string;
	contactPhone?: string;

	// Invoice Specific Fields
	poNumber?: string;
	paymentTerms?: string;

	// Settings & Toggles
	showTotalSection: boolean;
	showTotalInWords: boolean;
	summariseQuantity: boolean;

	// Tax Configuration
	taxConfig: {
		type: TaxType;
		placeOfSupply?: string;
		gstType?: GstType;
	};

	// Cess Configuration
	cessConfig?: {
		enabled: boolean;
		type: "central" | "state";
		name: string;
		isReverseCharge: boolean;
	};

	// Pricing
	discount: {
		type: DiscountType;
		amount: number;
		isPercentage: boolean;
	};
	additionalCharges: {
		title: string;
		amount: number;
		isPercentage: boolean;
	};

	// Custom Labels
	totalLabel: string;
	totalInWordsLabel: string;
	totalInWordsValue: string;

	// Rich Text Fields
	notes?: string;
	attachments?: string;
	info?: string;

	// Terms and Conditions
	termsTitle: string;
	termsList: string[];

	signatureUrl?: string;
}
