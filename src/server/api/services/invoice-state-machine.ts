import { and, eq } from "drizzle-orm";
import { invoices, products, stockMovements } from "~/server/db/schema";

export type InvoiceStatus =
	| "DRAFT"
	| "PROFORMA"
	| "SENT"
	| "VIEWED"
	| "PARTIALLY_PAID"
	| "PAID"
	| "OVERDUE"
	| "VOID"
	| "CREDIT_NOTE_ISSUED"
	| "CANCELLED";

const ALLOWED_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
	DRAFT: ["SENT", "PROFORMA", "VOID", "CANCELLED"],
	PROFORMA: ["DRAFT", "SENT", "VOID", "CANCELLED"],
	SENT: ["VIEWED", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID", "CANCELLED"],
	VIEWED: ["PARTIALLY_PAID", "PAID", "OVERDUE", "VOID", "CANCELLED"],
	PARTIALLY_PAID: ["PAID", "OVERDUE", "VOID", "CREDIT_NOTE_ISSUED"],
	OVERDUE: ["PARTIALLY_PAID", "PAID", "VOID", "CREDIT_NOTE_ISSUED", "CANCELLED"],
	PAID: ["CREDIT_NOTE_ISSUED"],
	VOID: [],
	CREDIT_NOTE_ISSUED: [],
	CANCELLED: ["DRAFT"],
};

export function isValidInvoiceTransition(
	currentStatus: InvoiceStatus,
	targetStatus: InvoiceStatus,
): boolean {
	if (currentStatus === targetStatus) return true;
	const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
	return allowed.includes(targetStatus);
}

/**
 * Hard inventory stock deduction on invoice fulfillment with immutable stockMovements ledger.
 */
export async function fulfillInvoiceStock(
	db: any,
	invoiceId: string,
	userId?: string,
) {
	const invoice = await db.query.invoices.findFirst({
		where: eq(invoices.id, invoiceId),
	});

	if (!invoice) throw new Error("Invoice not found");
	if (invoice.fulfilledAt) {
		return { success: true, message: "Invoice already fulfilled", movements: [] };
	}

	const rawItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
	const movements: any[] = [];

	for (const item of rawItems) {
		const productId = item.productId || item.id;
		const quantity = Number(item.quantity || 1);

		if (!productId || quantity <= 0) continue;

		const product = await db.query.products.findFirst({
			where: eq(products.id, productId),
		});

		if (!product) continue;

		const previousStock = product.stockQuantity;
		const newStock = Math.max(0, previousStock - quantity);
		const newReserved = Math.max(0, (product.reservedQuantity || 0) - quantity);

		// 1. Update product on-hand stock and release soft hold
		await db
			.update(products)
			.set({
				stockQuantity: newStock,
				reservedQuantity: newReserved,
			})
			.where(eq(products.id, productId));

		// 2. Record immutable stock ledger entry
		const [movement] = await db
			.insert(stockMovements)
			.values({
				organizationId: invoice.organizationId,
				productId,
				invoiceId: invoice.id,
				type: "INVOICE_FULFILLMENT",
				quantity: -quantity,
				previousStock,
				newStock,
				reason: `Order fulfilled on Invoice #${invoice.invoiceNumber}`,
				performedByUserId: userId ?? null,
			})
			.returning();

		movements.push(movement);
	}

	// 3. Mark invoice as fulfilled
	await db
		.update(invoices)
		.set({ fulfilledAt: new Date() })
		.where(eq(invoices.id, invoiceId));

	return { success: true, movements };
}

/**
 * Issues a credit note against an invoice, reversing balances and restoring stock.
 */
export async function issueInvoiceCreditNote(
	db: any,
	invoiceId: string,
	reason: string,
	userId?: string,
) {
	const invoice = await db.query.invoices.findFirst({
		where: eq(invoices.id, invoiceId),
	});

	if (!invoice) throw new Error("Invoice not found");
	if (invoice.status === "CREDIT_NOTE_ISSUED" || invoice.status === "VOID") {
		throw new Error("Credit note already issued or invoice voided");
	}

	const creditNoteNumber = `CN-${invoice.invoiceNumber}`;
	const rawItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];

	// Revert stock if fulfilled
	if (invoice.fulfilledAt) {
		for (const item of rawItems) {
			const productId = item.productId || item.id;
			const quantity = Number(item.quantity || 1);
			if (!productId || quantity <= 0) continue;

			const product = await db.query.products.findFirst({
				where: eq(products.id, productId),
			});
			if (!product) continue;

			const previousStock = product.stockQuantity;
			const newStock = previousStock + quantity;

			await db
				.update(products)
				.set({ stockQuantity: newStock })
				.where(eq(products.id, productId));

			await db.insert(stockMovements).values({
				organizationId: invoice.organizationId,
				productId,
				invoiceId: invoice.id,
				type: "RETURN",
				quantity,
				previousStock,
				newStock,
				reason: `Returned via Credit Note #${creditNoteNumber}: ${reason}`,
				performedByUserId: userId ?? null,
			});
		}
	}

	// Mark invoice status
	const [updatedInvoice] = await db
		.update(invoices)
		.set({
			status: "CREDIT_NOTE_ISSUED",
			creditNoteNumber,
			creditNoteReason: reason,
			balanceDue: 0,
		})
		.where(eq(invoices.id, invoiceId))
		.returning();

	return { success: true, creditNoteNumber, invoice: updatedInvoice };
}

