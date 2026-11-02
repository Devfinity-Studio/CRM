import { describe, expect, it } from "vitest";
import {
	calculateRegionalTax,
	listStatesForCountry,
	listSupportedCountries,
} from "~/server/api/services/tax-engine";

describe("Dynamic Regional Tax Engine", () => {
	it("should calculate India intra-state GST (50/50 split CGST + SGST)", () => {
		const result = calculateRegionalTax({
			sellerCountry: "IN",
			sellerState: "MH",
			buyerCountry: "IN",
			buyerState: "MH",
			subtotal: 10000, // ₹100.00
		});

		expect(result.taxType).toBe("GST");
		expect(result.totalTaxPercent).toBe(18);
		expect(result.totalTaxAmount).toBe(1800); // 18% of 10000
		expect(result.totalWithTax).toBe(11800);
		expect(result.isReverseCharge).toBe(false);
		expect(result.breakdown).toHaveLength(2);
		expect(result.breakdown[0]?.name).toContain("CGST (9%)");
		expect(result.breakdown[0]?.amount).toBe(900);
		expect(result.breakdown[1]?.name).toContain("SGST (9%)");
		expect(result.breakdown[1]?.amount).toBe(900);
	});

	it("should calculate India inter-state GST (IGST 18%)", () => {
		const result = calculateRegionalTax({
			sellerCountry: "IN",
			sellerState: "MH",
			buyerCountry: "IN",
			buyerState: "KA",
			subtotal: 50000,
		});

		expect(result.taxType).toBe("GST");
		expect(result.totalTaxPercent).toBe(18);
		expect(result.totalTaxAmount).toBe(9000);
		expect(result.breakdown).toHaveLength(1);
		expect(result.breakdown[0]?.name).toContain("IGST (18%)");
		expect(result.breakdown[0]?.amount).toBe(9000);
	});

	it("should apply zero-rating for international exports from India under LUT", () => {
		const result = calculateRegionalTax({
			sellerCountry: "IN",
			sellerState: "DL",
			buyerCountry: "US",
			buyerState: "CA",
			subtotal: 250000,
		});

		expect(result.taxType).toBe("ZERO_RATED");
		expect(result.totalTaxPercent).toBe(0);
		expect(result.totalTaxAmount).toBe(0);
		expect(result.totalWithTax).toBe(250000);
	});

	it("should handle India GST Reverse Charge Mechanism (RCM)", () => {
		const result = calculateRegionalTax({
			sellerCountry: "IN",
			sellerState: "KA",
			buyerCountry: "IN",
			buyerState: "KA",
			subtotal: 20000,
			isReverseCharge: true,
		});

		expect(result.isReverseCharge).toBe(true);
		expect(result.totalTaxAmount).toBe(0); // Payable by recipient
		expect(result.totalWithTax).toBe(20000);
	});

	it("should calculate UK standard VAT (20%)", () => {
		const result = calculateRegionalTax({
			sellerCountry: "GB",
			buyerCountry: "GB",
			subtotal: 10000,
		});

		expect(result.taxType).toBe("VAT");
		expect(result.totalTaxPercent).toBe(20);
		expect(result.totalTaxAmount).toBe(2000);
		expect(result.totalWithTax).toBe(12000);
	});

	it("should calculate EU cross-border B2B intra-community reverse charge (0%)", () => {
		const result = calculateRegionalTax({
			sellerCountry: "DE",
			buyerCountry: "FR",
			subtotal: 80000,
			isB2B: true,
			taxNumber: "FR123456789",
		});

		expect(result.taxType).toBe("VAT");
		expect(result.isReverseCharge).toBe(true);
		expect(result.totalTaxPercent).toBe(0);
		expect(result.totalTaxAmount).toBe(0);
	});

	it("should calculate US State sales tax by state (CA vs OR)", () => {
		const caResult = calculateRegionalTax({
			sellerCountry: "US",
			buyerCountry: "US",
			buyerState: "CA",
			subtotal: 10000,
		});
		expect(caResult.taxType).toBe("SALES_TAX");
		expect(caResult.totalTaxPercent).toBe(7.25);
		expect(caResult.totalTaxAmount).toBe(725);

		// Oregon has 0% state sales tax
		const orResult = calculateRegionalTax({
			sellerCountry: "US",
			buyerCountry: "US",
			buyerState: "OR",
			subtotal: 10000,
		});
		expect(orResult.totalTaxPercent).toBe(0);
		expect(orResult.totalTaxAmount).toBe(0);
	});

	it("should correctly list countries and states via country-state-city", () => {
		const countries = listSupportedCountries();
		expect(countries.length).toBeGreaterThan(100);
		expect(countries.some((c) => c.isoCode === "IN")).toBe(true);

		const states = listStatesForCountry("IN");
		expect(states.length).toBeGreaterThan(25);
		expect(states.some((s) => s.isoCode === "MH")).toBe(true);
	});
});

