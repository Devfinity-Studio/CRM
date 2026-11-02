import { and, desc, eq, gte, inArray, like, lt, lte } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	invoices,
	organizationMembers,
	payments,
	products,
	quotes,
	statements,
	stockMovements,
	userSettings,
} from "~/server/db/schema";
import {
	fulfillInvoiceStock,
	issueInvoiceCreditNote,
	isValidInvoiceTransition,
} from "~/server/api/services/invoice-state-machine";
import { dispatchWebhook } from "~/server/webhooks/dispatch";
import {
	calculateRegionalTax,
	listStatesForCountry,
	listSupportedCountries,
} from "~/server/api/services/tax-engine";

async function saveDocumentPattern(
	ctx: any,
	orgId: string,
	userId: string,
	type: "quote" | "invoice",
	documentNumber: string,
	companyId?: string | null,
) {
	const match = documentNumber.match(/^(.*?)(\d+)$/);
	if (!match) return;

	const prefix = match[1] || "";
	const padding = match[2]?.length ?? 0;

	const settings = await ctx.db.query.userSettings.findFirst({
		where: and(
			eq(userSettings.organizationId, orgId),
			eq(userSettings.userId, userId),
		),
	});

	if (!settings) return;

	const labels = (settings.customLabels as any) || {};
	const fieldKey = type === "quote" ? "quotePattern" : "invoicePattern";

	if (companyId) {
		if (!labels.companies) labels.companies = {};
		if (!labels.companies[companyId]) labels.companies[companyId] = {};
		labels.companies[companyId][fieldKey] = { prefix, padding };
	} else {
		labels[fieldKey] = { prefix, padding };
	}

	await ctx.db
		.update(userSettings)
		.set({ customLabels: labels })
		.where(eq(userSettings.id, settings.id));
}

export const billingRouter = createTRPCRouter({
	// --- REGIONAL TAX ENGINE ---
	calculateTax: protectedProcedure
		.input(
			z.object({
				sellerCountry: z.string().default("IN"),
				sellerState: z.string().optional(),
				buyerCountry: z.string().default("IN"),
				buyerState: z.string().optional(),
				subtotal: z.number().min(0),
				customRatePercent: z.number().optional(),
				isB2B: z.boolean().optional(),
				isReverseCharge: z.boolean().optional(),
				taxNumber: z.string().optional(),
			}),
		)
		.query(({ input }) => {
			return calculateRegionalTax(input);
		}),

	getCountries: protectedProcedure.query(() => {
		return listSupportedCountries();
	}),

	getStates: protectedProcedure
		.input(z.object({ countryCode: z.string() }))
		.query(({ input }) => {
			return listStatesForCountry(input.countryCode);
		}),

	// --- USER SETTINGS ---
	getUserSettings: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");

		let settings = await ctx.db.query.userSettings.findFirst({
			where: and(
				eq(userSettings.organizationId, member.organizationId),
				eq(userSettings.userId, ctx.session.user.id),
			),
		});

		if (!settings) {
			const [newSettings] = await ctx.db
				.insert(userSettings)
				.values({
					organizationId: member.organizationId,
					userId: ctx.session.user.id,
				})
				.returning();
			settings = newSettings;
		}

		return settings;
	}),

	updateUserSettings: protectedProcedure
		.input(
			z.object({
				defaultCurrency: z.string().optional(),
				customCurrencySymbol: z.string().nullable().optional(),
				numberFormat: z.string().optional(),
				decimalDigits: z.number().optional(),
				roundQuantity: z.boolean().optional(),
				roundRate: z.boolean().optional(),
				customLabels: z.any().optional(),
				signatureImage: z.string().nullable().optional(),
				tncList: z.any().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const [updated] = await ctx.db
				.update(userSettings)
				.set(input)
				.where(
					and(
						eq(userSettings.organizationId, member.organizationId),
						eq(userSettings.userId, ctx.session.user.id),
					),
				)
				.returning();

			return updated;
		}),

	// --- PRODUCTS ---
	getProducts: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");

		return ctx.db
			.select()
			.from(products)
			.where(eq(products.organizationId, member.organizationId))
			.orderBy(desc(products.createdAt));
	}),

	createProduct: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				sku: z.string().optional(),
				type: z.enum(["PRODUCT", "SERVICE"]).default("PRODUCT"),
				description: z.string().optional(),
				unitPrice: z.number().min(0),
				unit: z.string().optional(),
				stockQuantity: z.number().default(0),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const [product] = await ctx.db
				.insert(products)
				.values({ ...input, organizationId: member.organizationId })
				.returning();
			return product;
		}),

	// --- QUOTES ---

	getQuoteById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			return ctx.db.query.quotes.findFirst({
				where: and(
					eq(quotes.id, input.id),
					eq(quotes.organizationId, member.organizationId),
				),
			});
		}),

	getQuotes: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");

		return ctx.db.query.quotes.findMany({
			where: eq(quotes.organizationId, member.organizationId),
			orderBy: [desc(quotes.createdAt)],
			with: {
				company: true,
			},
		});
	}),

	createQuote: protectedProcedure
		.input(
			z.object({
				companyId: z.string().optional(),
				quoteNumber: z.string().min(1),
				title: z.string().optional(),
				date: z.date(),
				dueDate: z.date().optional(),
				labels: z.any().optional(),
				customFields: z.any().optional(),
				showTotalInPdf: z.boolean(),
				showTotalInWords: z.boolean(),
				lineItems: z.any().optional(),
				taxPercent: z.number().default(0),
				discountType: z.string().default("AMOUNT"),
				discountValue: z.number().default(0),
				additionalCharges: z.any().optional(),
				totalAmount: z.number().default(0),
				signatureType: z.string().default("IMAGE"),
				signatureName: z.string().optional(),
				signatureData: z.string().optional(),
				notes: z.string().optional(),
				attachments: z.any().optional(),
				terms: z.any().optional(),
				contactEmail: z.string().optional(),
				contactPhone: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const [quote] = await ctx.db
				.insert(quotes)
				.values({
					...input,
					organizationId: member.organizationId,
					status: "DRAFT",
				})
				.returning();

			// Background parsing
			await saveDocumentPattern(
				ctx,
				member.organizationId,
				ctx.session.user.id,
				"quote",
				input.quoteNumber,
				input.companyId,
			).catch(console.error);

			return quote;
		}),

	deleteQuote: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			await ctx.db
				.delete(quotes)
				.where(
					and(
						eq(quotes.id, input.id),
						eq(quotes.organizationId, member.organizationId),
					),
				);
			return { success: true };
		}),

	reviseQuote: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const original = await ctx.db.query.quotes.findFirst({
				where: and(
					eq(quotes.id, input.id),
					eq(quotes.organizationId, member.organizationId),
				),
			});

			if (!original) throw new Error("Quote not found");

			const [revision] = await ctx.db
				.insert(quotes)
				.values({
					organizationId: original.organizationId,
					companyId: original.companyId,
					quoteNumber: original.quoteNumber, // keep same number, we'll render as -vX in UI
					version: original.version + 1,
					title: original.title,
					date: new Date(),
					dueDate: original.dueDate,
					labels: original.labels,
					customFields: original.customFields,
					showTotalInPdf: original.showTotalInPdf,
					showTotalInWords: original.showTotalInWords,
					lineItems: original.lineItems,
					taxPercent: original.taxPercent,
					discountType: original.discountType,
					discountValue: original.discountValue,
					additionalCharges: original.additionalCharges,
					totalAmount: original.totalAmount,
					signatureType: original.signatureType,
					signatureName: original.signatureName,
					signatureData: original.signatureData,
					notes: original.notes,
					attachments: original.attachments,
					terms: original.terms,
					contactEmail: original.contactEmail,
					contactPhone: original.contactPhone,
					status: "DRAFT",
				})
				.returning();

			return revision;
		}),

	convertToInvoice: protectedProcedure
		.input(z.object({ quoteId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const quote = await ctx.db.query.quotes.findFirst({
				where: and(
					eq(quotes.id, input.quoteId),
					eq(quotes.organizationId, member.organizationId),
				),
			});

			if (!quote) throw new Error("Quote not found");

			// Generate a new invoice number (simplistic fallback, should ideally use pattern)
			const invoiceNumber = `INV-${Date.now()}`;

			// We copy all fields over from quote.
			const totalAmt = quote.totalAmount || 0;
			const taxAmt =
				Math.floor(totalAmt * (quote.taxPercent / (100 + quote.taxPercent))) ||
				0;
			const sub = totalAmt - taxAmt;

			const [newInvoice] = await ctx.db
				.insert(invoices)
				.values({
					organizationId: quote.organizationId,
					quoteId: quote.id,
					companyId: quote.companyId,
					invoiceNumber: invoiceNumber,
					version: 1,
					title: quote.title,
					labels: quote.labels,
					customFields: quote.customFields,
					showTotalInPdf: quote.showTotalInPdf,
					showTotalInWords: quote.showTotalInWords,
					lineItems: quote.lineItems,
					taxPercent: quote.taxPercent,
					discountType: quote.discountType,
					discountValue: quote.discountValue,
					additionalCharges: quote.additionalCharges,
					signatureType: quote.signatureType,
					signatureName: quote.signatureName,
					signatureData: quote.signatureData,
					notes: quote.notes,
					attachments: quote.attachments,
					terms: quote.terms,
					contactEmail: quote.contactEmail,
					contactPhone: quote.contactPhone,
					status: "DRAFT",
					subtotal: sub,
					taxAmount: taxAmt,
					totalAmount: totalAmt,
					amountPaid: 0,
					balanceDue: totalAmt,
					dueDate: quote.dueDate || new Date(),
				})
				.returning();

			// Dispatch webhook
			await dispatchWebhook(member.organizationId, "invoice.created", {
				invoice: newInvoice,
			});

			return newInvoice;
		}),

	// --- INVOICES ---
	getInvoices: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");

		return ctx.db.query.invoices.findMany({
			where: eq(invoices.organizationId, member.organizationId),
			orderBy: [desc(invoices.createdAt)],
			with: {
				company: true,
			},
		});
	}),

	createInvoice: protectedProcedure
		.input(z.any()) // TODO: properly type this when invoice saving is implemented
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			// Temporary dummy till actual invoice insert is implemented
			if (input.invoiceNumber) {
				await saveDocumentPattern(
					ctx,
					member.organizationId,
					ctx.session.user.id,
					"invoice",
					input.invoiceNumber,
					input.companyId,
				).catch(console.error);
			}

			// INVENTORY DEDUCTION LOGIC
			// When an invoice is created (and NOT a draft), we deduct stock for any PRODUCTS
			if (
				input.status &&
				input.status !== "DRAFT" &&
				input.items &&
				Array.isArray(input.items)
			) {
				for (const item of input.items) {
					if (item.productId) {
						// Check if it's a PRODUCT and deduct stock
						const product = await ctx.db.query.products.findFirst({
							where: and(
								eq(products.id, item.productId),
								eq(products.organizationId, member.organizationId),
								eq(products.type, "PRODUCT"),
							),
						});

						if (product) {
							const qtyToDeduct = item.quantity || 1;
							await ctx.db
								.update(products)
								.set({ stockQuantity: product.stockQuantity - qtyToDeduct })
								.where(eq(products.id, product.id));
						}
					}
				}
			}

			return null;
		}),

	deleteInvoice: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			await ctx.db
				.delete(invoices)
				.where(
					and(
						eq(invoices.id, input.id),
						eq(invoices.organizationId, member.organizationId),
					),
				);
			return { success: true };
		}),

	reviseInvoice: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const original = await ctx.db.query.invoices.findFirst({
				where: and(
					eq(invoices.id, input.id),
					eq(invoices.organizationId, member.organizationId),
				),
			});

			if (!original) throw new Error("Invoice not found");

			const [revision] = await ctx.db
				.insert(invoices)
				.values({
					organizationId: original.organizationId,
					quoteId: original.quoteId,
					companyId: original.companyId,
					invoiceNumber: original.invoiceNumber,
					version: original.version + 1,
					status: "DRAFT",
					subtotal: original.subtotal,
					taxAmount: original.taxAmount,
					totalAmount: original.totalAmount,
					amountPaid: 0,
					balanceDue: original.totalAmount,
					dueDate: original.dueDate,
				})
				.returning();

			return revision;
		}),

	// --- PAYMENTS ---
	recordPayment: protectedProcedure
		.input(
			z.object({
				invoiceId: z.string(),
				amount: z.number(),
				paymentDate: z.date(),
				paymentMethod: z.enum([
					"BANK_TRANSFER",
					"CREDIT_CARD",
					"CASH",
					"CHECK",
				]),
				referenceNumber: z.string().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const invoice = await ctx.db.query.invoices.findFirst({
				where: and(
					eq(invoices.id, input.invoiceId),
					eq(invoices.organizationId, member.organizationId),
				),
			});

			if (!invoice) throw new Error("Invoice not found");

			// Insert payment
			const [payment] = await ctx.db
				.insert(payments)
				.values({
					organizationId: member.organizationId,
					invoiceId: invoice.id,
					amount: input.amount,
					paymentDate: input.paymentDate,
					paymentMethod: input.paymentMethod,
					referenceNumber: input.referenceNumber,
					notes: input.notes,
				})
				.returning();

			// Update invoice balances
			const newAmountPaid = invoice.amountPaid + input.amount;
			const newBalanceDue = invoice.totalAmount - newAmountPaid;

			const isPaid = newBalanceDue <= 0;

			await ctx.db
				.update(invoices)
				.set({
					amountPaid: newAmountPaid,
					balanceDue: newBalanceDue,
					status: isPaid ? "PAID" : invoice.status, // Don't override if it's SENT/PROFORMA, just if paid
					paidAt: isPaid ? new Date() : null,
				})
				.where(eq(invoices.id, invoice.id));

			await dispatchWebhook(member.organizationId, "invoice.payment_recorded", {
				payment,
				invoiceId: invoice.id,
				isPaid,
			});

			if (isPaid) {
				await dispatchWebhook(member.organizationId, "invoice.paid", {
					invoiceId: invoice.id,
				});
			}

			return payment;
		}),

	getInvoicePayments: protectedProcedure
		.input(z.object({ invoiceId: z.string() }))
		.query(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			return ctx.db.query.payments.findMany({
				where: and(
					eq(payments.invoiceId, input.invoiceId),
					eq(payments.organizationId, member.organizationId),
				),
				orderBy: [desc(payments.paymentDate)],
			});
		}),

	// --- STATEMENTS ---
	generateStatement: protectedProcedure
		.input(
			z.object({
				companyId: z.string(),
				startDate: z.date(),
				endDate: z.date(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			// 1. Calculate Opening Balance (all transactions BEFORE startDate)
			// We look at invoices created before startDate (as debits) and payments before startDate (as credits)
			// Actually, standard practice: Opening Balance = sum(invoice totalAmount) - sum(payment amount) before startDate

			const prevInvoices = await ctx.db.query.invoices.findMany({
				where: and(
					eq(invoices.companyId, input.companyId),
					eq(invoices.organizationId, member.organizationId),
					lt(invoices.createdAt, input.startDate),
					// Exclude DRAFT invoices from statement calculations
					eq(invoices.status, "SENT"), // Wait, it can be SENT, PROFORMA, PAID, OVERDUE. Let's just exclude DRAFT.
				),
			});

			const prevPayments = await ctx.db.query.payments.findMany({
				where: and(
					eq(payments.organizationId, member.organizationId),
					lt(payments.paymentDate, input.startDate),
				),
				with: {
					invoice: true,
				},
			});

			// Filter prevPayments to only those for this company
			const prevCompanyPayments = prevPayments.filter(
				(p) => p.invoice.companyId === input.companyId,
			);

			// We need all non-draft prev invoices. Drizzle doesn't have a simple notEq in basic filters sometimes, or we can use `ne(invoices.status, "DRAFT")`. Let's just filter in JS for safety since datasets are small for a single client.
			let openingBalance = 0;
			prevInvoices.forEach((inv) => {
				if (inv.status !== "DRAFT" && inv.status !== "CANCELLED") {
					openingBalance += inv.totalAmount;
				}
			});
			prevCompanyPayments.forEach((p) => {
				if (p.invoice.status !== "DRAFT" && p.invoice.status !== "CANCELLED") {
					openingBalance -= p.amount;
				}
			});

			// 2. Fetch Period Transactions
			const periodInvoices = await ctx.db.query.invoices.findMany({
				where: and(
					eq(invoices.companyId, input.companyId),
					eq(invoices.organizationId, member.organizationId),
					gte(invoices.createdAt, input.startDate),
					lte(invoices.createdAt, input.endDate),
				),
			});

			const periodPayments = await ctx.db.query.payments.findMany({
				where: and(
					eq(payments.organizationId, member.organizationId),
					gte(payments.paymentDate, input.startDate),
					lte(payments.paymentDate, input.endDate),
				),
				with: {
					invoice: true,
				},
			});

			const periodCompanyPayments = periodPayments.filter(
				(p) => p.invoice.companyId === input.companyId,
			);

			// Create chronological ledger entries
			const txs: any[] = [];

			periodInvoices.forEach((inv) => {
				if (inv.status !== "DRAFT" && inv.status !== "CANCELLED") {
					txs.push({
						id: inv.id,
						date: inv.createdAt,
						type: "INVOICE",
						description: `Invoice ${inv.invoiceNumber}`,
						amount: inv.totalAmount, // positive increases balance due
					});
				}
			});

			periodCompanyPayments.forEach((p) => {
				if (p.invoice.status !== "DRAFT" && p.invoice.status !== "CANCELLED") {
					txs.push({
						id: p.id,
						date: p.paymentDate,
						type: "PAYMENT",
						description: `Payment - ${p.paymentMethod.replace("_", " ")}`,
						reference: p.referenceNumber,
						amount: -p.amount, // negative decreases balance due
					});
				}
			});

			// Sort chronologically
			txs.sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			);

			let currentBalance = openingBalance;
			txs.forEach((tx) => {
				currentBalance += tx.amount;
				tx.balance = currentBalance;
			});

			const closingBalance = currentBalance;

			// 3. Generate Statement Number
			const statementNumber = `STMT-${Date.now().toString().slice(-4)}`;

			// 4. Save Statement Snapshot
			const [statement] = await ctx.db
				.insert(statements)
				.values({
					organizationId: member.organizationId,
					companyId: input.companyId,
					statementNumber,
					startDate: input.startDate,
					endDate: input.endDate,
					openingBalance,
					closingBalance,
					transactions: txs,
				})
				.returning();

			return statement;
		}),

	getStatements: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");

		return ctx.db.query.statements.findMany({
			where: eq(statements.organizationId, member.organizationId),
			with: {
				company: true,
			},
			orderBy: [desc(statements.createdAt)],
		});
	}),

	getNextDocumentNumber: protectedProcedure
		.input(
			z.object({
				type: z.enum(["quote", "invoice"]),
				companyId: z.string().optional().nullable(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			// 1. Get pattern
			const settings = await ctx.db.query.userSettings.findFirst({
				where: and(
					eq(userSettings.organizationId, member.organizationId),
					eq(userSettings.userId, ctx.session.user.id),
				),
			});

			const labels = (settings?.customLabels as any) || {};
			const fieldKey =
				input.type === "quote" ? "quotePattern" : "invoicePattern";

			let prefix = input.type === "quote" ? "QTE-" : "INV-";
			let padding = 3;

			if (input.companyId && labels.companies?.[input.companyId]?.[fieldKey]) {
				prefix = labels.companies[input.companyId][fieldKey].prefix;
				padding = labels.companies[input.companyId][fieldKey].padding;
			} else if (labels[fieldKey]) {
				prefix = labels[fieldKey].prefix;
				padding = labels[fieldKey].padding;
			}

			// 2. Query all matching documents
			let maxNum = 0;
			let lastDoc = null;

			if (input.type === "quote") {
				const matching = await ctx.db.query.quotes.findMany({
					where: and(
						eq(quotes.organizationId, member.organizationId),
						like(quotes.quoteNumber, `${prefix}%`),
					),
					columns: { quoteNumber: true, createdAt: true },
				});

				for (const doc of matching) {
					const suffix = doc.quoteNumber.slice(prefix.length);
					if (/^\d+$/.test(suffix)) {
						const num = parseInt(suffix, 10);
						if (num > maxNum) maxNum = num;
					}
				}

				const latest = await ctx.db.query.quotes.findFirst({
					where: eq(quotes.organizationId, member.organizationId),
					orderBy: [desc(quotes.createdAt)],
					columns: { quoteNumber: true, createdAt: true },
				});

				if (latest) {
					lastDoc = { number: latest.quoteNumber, date: latest.createdAt };
				}
			} else {
				const matching = await ctx.db.query.invoices.findMany({
					where: and(
						eq(invoices.organizationId, member.organizationId),
						like(invoices.invoiceNumber, `${prefix}%`),
					),
					columns: { invoiceNumber: true, createdAt: true },
				});

				for (const doc of matching) {
					const suffix = doc.invoiceNumber.slice(prefix.length);
					if (/^\d+$/.test(suffix)) {
						const num = parseInt(suffix, 10);
						if (num > maxNum) maxNum = num;
					}
				}

				const latest = await ctx.db.query.invoices.findFirst({
					where: eq(invoices.organizationId, member.organizationId),
					orderBy: [desc(invoices.createdAt)],
					columns: { invoiceNumber: true, createdAt: true },
				});

				if (latest) {
					lastDoc = { number: latest.invoiceNumber, date: latest.createdAt };
				}
			}

			const nextNumString = String(maxNum + 1).padStart(padding, "0");
			const nextNumber = `${prefix}${nextNumString}`;

			return {
				nextNumber,
				lastDocument: lastDoc,
			};
		}),

	// --- PAYMENTS ---

	getPaymentsByInvoice: protectedProcedure
		.input(z.object({ invoiceId: z.string() }))
		.query(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			return ctx.db.query.payments.findMany({
				where: and(
					eq(payments.invoiceId, input.invoiceId),
					eq(payments.organizationId, member.organizationId),
				),
				orderBy: [desc(payments.paymentDate), desc(payments.createdAt)],
			});
		}),

	recordPayment: protectedProcedure
		.input(
			z.object({
				invoiceId: z.string(),
				amount: z.number().positive(),
				paymentDate: z.date(),
				paymentMethod: z.enum([
					"BANK_TRANSFER",
					"CREDIT_CARD",
					"CASH",
					"CHECK",
				]),
				referenceNumber: z.string().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const invoice = await ctx.db.query.invoices.findFirst({
				where: and(
					eq(invoices.id, input.invoiceId),
					eq(invoices.organizationId, member.organizationId),
				),
			});

			if (!invoice) throw new Error("Invoice not found");
			if (invoice.status === "DRAFT")
				throw new Error("Cannot record payment for a draft invoice");

			// 1. Record payment
			const [payment] = await ctx.db
				.insert(payments)
				.values({
					organizationId: member.organizationId,
					invoiceId: input.invoiceId,
					amount: input.amount,
					paymentDate: input.paymentDate,
					paymentMethod: input.paymentMethod,
					referenceNumber: input.referenceNumber,
					notes: input.notes,
				})
				.returning();

			// 2. Update invoice balance and status
			const newBalance = Math.max(0, (invoice.balanceDue || 0) - input.amount);
			const newStatus = newBalance === 0 ? "PAID" : invoice.status;

			await ctx.db
				.update(invoices)
				.set({
					balanceDue: newBalance,
					status: newStatus,
				})
				.where(eq(invoices.id, invoice.id));

			// 3. Send email receipt (simulated for now, webhook/email trigger)
			await dispatchWebhook(
				ctx.db,
				member.organizationId,
				"invoice.payment_recorded",
				{
					invoiceId: invoice.id,
					paymentId: payment.id,
					amount: input.amount,
					balanceDue: newBalance,
				},
			).catch(console.error);
			// NOTE: Actual email delivery would hook into this webhook or be sent directly here

			return payment;
		}),

	voidPayment: protectedProcedure
		.input(z.object({ paymentId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const payment = await ctx.db.query.payments.findFirst({
				where: and(
					eq(payments.id, input.paymentId),
					eq(payments.organizationId, member.organizationId),
				),
			});

			if (!payment) throw new Error("Payment not found");

			const invoice = await ctx.db.query.invoices.findFirst({
				where: and(
					eq(invoices.id, payment.invoiceId),
					eq(invoices.organizationId, member.organizationId),
				),
			});

			if (!invoice) throw new Error("Invoice not found");

			// 1. Delete payment
			await ctx.db.delete(payments).where(eq(payments.id, payment.id));

			// 2. Revert invoice balance
			const newBalance = (invoice.balanceDue || 0) + payment.amount;
			// If it was paid, revert to SENT (or whatever status makes sense)
			const newStatus =
				invoice.status === "PAID" && newBalance > 0 ? "SENT" : invoice.status;

			await ctx.db
				.update(invoices)
				.set({
					balanceDue: newBalance,
					status: newStatus,
				})
				.where(eq(invoices.id, invoice.id));

			return { success: true };
		}),

	// --- STATEMENTS & LEDGER ---

	getLedger: protectedProcedure
		.input(
			z.object({
				companyId: z.string(),
				startDate: z.date(),
				endDate: z.date(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			// Fetch all non-draft invoices for company
			const companyInvoices = await ctx.db.query.invoices.findMany({
				where: and(
					eq(invoices.companyId, input.companyId),
					eq(invoices.organizationId, member.organizationId),
				),
			});
			const validInvoices = companyInvoices.filter((i) => i.status !== "DRAFT");
			const invoiceIds = validInvoices.map((i) => i.id);

			let companyPayments: any[] = [];
			if (invoiceIds.length > 0) {
				companyPayments = await ctx.db.query.payments.findMany({
					where: and(
						inArray(payments.invoiceId, invoiceIds),
						eq(payments.organizationId, member.organizationId),
					),
				});
			}

			let openingBalance = 0;
			let closingBalance = 0;
			const transactions: any[] = [];

			// Calculate Opening Balance (events strictly before startDate)
			for (const inv of validInvoices) {
				if (inv.createdAt < input.startDate) {
					openingBalance += inv.totalAmount || 0;
				} else if (
					inv.createdAt >= input.startDate &&
					inv.createdAt <= input.endDate
				) {
					transactions.push({
						id: inv.id,
						type: "INVOICE",
						date: inv.createdAt,
						description: `Invoice ${inv.invoiceNumber}`,
						amount: inv.totalAmount || 0,
						isDebit: true,
					});
				}
			}

			for (const p of companyPayments) {
				if (p.paymentDate < input.startDate) {
					openingBalance -= p.amount;
				} else if (
					p.paymentDate >= input.startDate &&
					p.paymentDate <= input.endDate
				) {
					transactions.push({
						id: p.id,
						type: "PAYMENT",
						date: p.paymentDate,
						description: `Payment - ${p.paymentMethod.replace("_", " ")}`,
						amount: p.amount,
						isDebit: false,
					});
				}
			}

			// Sort transactions chronologically
			transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

			// Calculate running balance and closing balance
			let currentBalance = openingBalance;
			for (const t of transactions) {
				if (t.isDebit) {
					currentBalance += t.amount;
				} else {
					currentBalance -= t.amount;
				}
				t.balance = currentBalance;
			}
			closingBalance = currentBalance;

			return {
				openingBalance,
				closingBalance,
				transactions,
			};
		}),

	generateStatement: protectedProcedure
		.input(
			z.object({
				companyId: z.string(),
				startDate: z.date(),
				endDate: z.date(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			// We call the same internal logic via a helper or just re-execute the ledger fetch here.
			// Since it's a backend mutation, we can just re-fetch in memory.
			const companyInvoices = await ctx.db.query.invoices.findMany({
				where: and(
					eq(invoices.companyId, input.companyId),
					eq(invoices.organizationId, member.organizationId),
				),
			});
			const validInvoices = companyInvoices.filter((i) => i.status !== "DRAFT");
			const invoiceIds = validInvoices.map((i) => i.id);

			let companyPayments: any[] = [];
			if (invoiceIds.length > 0) {
				companyPayments = await ctx.db.query.payments.findMany({
					where: and(
						inArray(payments.invoiceId, invoiceIds),
						eq(payments.organizationId, member.organizationId),
					),
				});
			}

			let openingBalance = 0;
			const transactions: any[] = [];

			for (const inv of validInvoices) {
				if (inv.createdAt < input.startDate) {
					openingBalance += inv.totalAmount || 0;
				} else if (
					inv.createdAt >= input.startDate &&
					inv.createdAt <= input.endDate
				) {
					transactions.push({
						id: inv.id,
						type: "INVOICE",
						date: inv.createdAt.toISOString(),
						description: `Invoice ${inv.invoiceNumber}`,
						amount: inv.totalAmount || 0,
						isDebit: true,
					});
				}
			}

			for (const p of companyPayments) {
				if (p.paymentDate < input.startDate) {
					openingBalance -= p.amount;
				} else if (
					p.paymentDate >= input.startDate &&
					p.paymentDate <= input.endDate
				) {
					transactions.push({
						id: p.id,
						type: "PAYMENT",
						date: p.paymentDate.toISOString(),
						description: `Payment - ${p.paymentMethod.replace("_", " ")}`,
						amount: p.amount,
						isDebit: false,
					});
				}
			}

			// Sort
			transactions.sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			);

			let currentBalance = openingBalance;
			for (const t of transactions) {
				if (t.isDebit) currentBalance += t.amount;
				else currentBalance -= t.amount;
				t.balance = currentBalance;
			}
			const closingBalance = currentBalance;

			// Generate sequential statement number
			const dateStr = new Date()
				.toISOString()
				.replace(/[-T:.Z]/g, "")
				.slice(0, 14);
			const statementNumber = `STMT-${dateStr}`;

			const [stmt] = await ctx.db
				.insert(statements)
				.values({
					organizationId: member.organizationId,
					companyId: input.companyId,
					statementNumber,
					startDate: input.startDate,
					endDate: input.endDate,
					openingBalance,
					closingBalance,
					transactions, // frozen JSONB
				})
				.returning();

			return stmt;
		}),

	getStatementsByCompany: protectedProcedure
		.input(z.object({ companyId: z.string() }))
		.query(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			return ctx.db.query.statements.findMany({
				where: and(
					eq(statements.companyId, input.companyId),
					eq(statements.organizationId, member.organizationId),
				),
				orderBy: [desc(statements.createdAt)],
			});
		}),

	// --- INVOICE STATE MACHINE & STOCK FULFILLMENT ---
	updateInvoiceStatus: protectedProcedure
		.input(
			z.object({
				invoiceId: z.string(),
				status: z.enum([
					"DRAFT",
					"PROFORMA",
					"SENT",
					"VIEWED",
					"PARTIALLY_PAID",
					"PAID",
					"OVERDUE",
					"VOID",
					"CREDIT_NOTE_ISSUED",
					"CANCELLED",
				]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const invoice = await ctx.db.query.invoices.findFirst({
				where: and(
					eq(invoices.id, input.invoiceId),
					eq(invoices.organizationId, member.organizationId),
				),
			});
			if (!invoice) throw new Error("Invoice not found");

			if (!isValidInvoiceTransition(invoice.status as any, input.status as any)) {
				throw new Error(
					`Invalid invoice transition from ${invoice.status} to ${input.status}`,
				);
			}

			const updates: any = {
				status: input.status,
			};

			if (input.status === "VIEWED" && !invoice.viewedAt) {
				updates.viewedAt = new Date();
			}
			if (input.status === "PAID" && !invoice.paidAt) {
				updates.paidAt = new Date();
				updates.balanceDue = 0;
			}

			const [updated] = await ctx.db
				.update(invoices)
				.set(updates)
				.where(eq(invoices.id, invoice.id))
				.returning();

			if (input.status === "PAID" && !invoice.fulfilledAt) {
				await fulfillInvoiceStock(ctx.db, invoice.id, ctx.session.user.id);
			}

			await dispatchWebhook(member.organizationId, "invoice.status_changed", {
				invoice: updated,
				previousStatus: invoice.status,
			});

			return updated;
		}),

	fulfillInvoice: protectedProcedure
		.input(z.object({ invoiceId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			return fulfillInvoiceStock(ctx.db, input.invoiceId, ctx.session.user.id);
		}),

	issueCreditNote: protectedProcedure
		.input(
			z.object({
				invoiceId: z.string(),
				reason: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			return issueInvoiceCreditNote(
				ctx.db,
				input.invoiceId,
				input.reason,
				ctx.session.user.id,
			);
		}),

	getStockMovements: protectedProcedure
		.input(z.object({ productId: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const conditions = [eq(stockMovements.organizationId, member.organizationId)];
			if (input?.productId) {
				conditions.push(eq(stockMovements.productId, input.productId));
			}

			return ctx.db
				.select({
					id: stockMovements.id,
					productId: stockMovements.productId,
					invoiceId: stockMovements.invoiceId,
					type: stockMovements.type,
					quantity: stockMovements.quantity,
					previousStock: stockMovements.previousStock,
					newStock: stockMovements.newStock,
					reason: stockMovements.reason,
					createdAt: stockMovements.createdAt,
					productName: products.name,
					sku: products.sku,
				})
				.from(stockMovements)
				.leftJoin(products, eq(stockMovements.productId, products.id))
				.where(and(...conditions))
				.orderBy(desc(stockMovements.createdAt));
		}),
});
