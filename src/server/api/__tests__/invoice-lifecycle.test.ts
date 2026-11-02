import { describe, expect, it, vi } from "vitest";
import {
	fulfillInvoiceStock,
	issueInvoiceCreditNote,
	isValidInvoiceTransition,
} from "~/server/api/services/invoice-state-machine";

describe("Invoicing Lifecycle & State Machine", () => {
	it("should enforce valid and invalid state transitions", () => {
		// Valid transitions
		expect(isValidInvoiceTransition("DRAFT", "SENT")).toBe(true);
		expect(isValidInvoiceTransition("SENT", "VIEWED")).toBe(true);
		expect(isValidInvoiceTransition("VIEWED", "PARTIALLY_PAID")).toBe(true);
		expect(isValidInvoiceTransition("PARTIALLY_PAID", "PAID")).toBe(true);
		expect(isValidInvoiceTransition("PAID", "CREDIT_NOTE_ISSUED")).toBe(true);
		expect(isValidInvoiceTransition("OVERDUE", "PAID")).toBe(true);

		// Invalid transitions (Terminal or illegal backwards)
		expect(isValidInvoiceTransition("PAID", "DRAFT")).toBe(false);
		expect(isValidInvoiceTransition("VOID", "SENT")).toBe(false);
		expect(isValidInvoiceTransition("CREDIT_NOTE_ISSUED", "PAID")).toBe(false);
	});

	it("should execute hard stock deduction upon invoice fulfillment and record ledger entry", async () => {
		const mockInvoice = {
			id: "inv-100",
			invoiceNumber: "INV-2026-001",
			organizationId: "org-1",
			fulfilledAt: null,
			lineItems: [
				{
					productId: "prod-1",
					quantity: 5,
				},
			],
		};

		const mockProduct = {
			id: "prod-1",
			stockQuantity: 20,
			reservedQuantity: 5,
		};

		let updatedStock = 0;
		let updatedReserved = 0;
		let insertedMovement: any = null;

		const mockDb = {
			query: {
				invoices: {
					findFirst: vi.fn().mockResolvedValue(mockInvoice),
				},
				products: {
					findFirst: vi.fn().mockResolvedValue(mockProduct),
				},
			},
			update: vi.fn().mockImplementation((table) => ({
				set: vi.fn().mockImplementation((vals) => {
					if (vals.stockQuantity !== undefined) {
						updatedStock = vals.stockQuantity;
						updatedReserved = vals.reservedQuantity;
					}
					return {
						where: vi.fn().mockResolvedValue([]),
					};
				}),
			})),
			insert: vi.fn().mockImplementation(() => ({
				values: vi.fn().mockImplementation((val) => {
					insertedMovement = val;
					return {
						returning: vi.fn().mockResolvedValue([val]),
					};
				}),
			})),
		};

		const result = await fulfillInvoiceStock(mockDb, "inv-100", "user-1");

		expect(result.success).toBe(true);
		expect(updatedStock).toBe(15); // 20 - 5
		expect(updatedReserved).toBe(0); // 5 - 5 released soft hold
		expect(insertedMovement).toBeDefined();
		expect(insertedMovement.type).toBe("INVOICE_FULFILLMENT");
		expect(insertedMovement.quantity).toBe(-5);
		expect(insertedMovement.previousStock).toBe(20);
		expect(insertedMovement.newStock).toBe(15);
	});

	it("should issue a credit note and restore inventory stock", async () => {
		const mockInvoice = {
			id: "inv-200",
			invoiceNumber: "INV-2026-002",
			organizationId: "org-1",
			fulfilledAt: new Date(),
			status: "PAID",
			lineItems: [
				{
					productId: "prod-1",
					quantity: 3,
				},
			],
		};

		const mockProduct = {
			id: "prod-1",
			stockQuantity: 15,
		};

		let restoredStock = 0;
		let returnMovement: any = null;

		const mockDb = {
			query: {
				invoices: {
					findFirst: vi.fn().mockResolvedValue(mockInvoice),
				},
				products: {
					findFirst: vi.fn().mockResolvedValue(mockProduct),
				},
			},
			update: vi.fn().mockImplementation(() => ({
				set: vi.fn().mockImplementation((vals) => {
					if (vals.stockQuantity !== undefined) {
						restoredStock = vals.stockQuantity;
					}
					return {
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([
								{
									...mockInvoice,
									...vals,
								},
							]),
						}),
					};
				}),
			})),
			insert: vi.fn().mockImplementation(() => ({
				values: vi.fn().mockImplementation((val) => {
					returnMovement = val;
					return Promise.resolve([val]);
				}),
			})),
		};

		const result = await issueInvoiceCreditNote(
			mockDb,
			"inv-200",
			"Customer ordered wrong model",
			"user-admin",
		);

		expect(result.success).toBe(true);
		expect(result.creditNoteNumber).toBe("CN-INV-2026-002");
		expect(restoredStock).toBe(18); // 15 + 3
		expect(returnMovement.type).toBe("RETURN");
		expect(returnMovement.quantity).toBe(3);
	});
});

