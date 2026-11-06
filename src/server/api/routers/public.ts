import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { deals, invoices, payments, quotes, statements } from "~/server/db/schema";
import { emitDomainEvent } from "~/server/events/event-bus";

export const publicRouter = createTRPCRouter({
	signQuote: publicProcedure
		.input(
			z.object({
				id: z.string(),
				signatureData: z.string().min(1),
				signatureName: z.string().min(1),
				signerEmail: z.string().email().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const quote = await ctx.db.query.quotes.findFirst({
				where: eq(quotes.id, input.id),
			});

			if (!quote) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Quote not found",
				});
			}

			if (quote.status === "ACCEPTED" || quote.status === "SIGNED") {
				return { success: true, message: "Quote already signed", quote };
			}

			const now = new Date();
			const [signed] = await ctx.db
				.update(quotes)
				.set({
					status: "ACCEPTED",
					signatureType: "DIGITAL_CANVAS",
					signatureData: input.signatureData,
					signatureName: input.signatureName,
					signerEmail: input.signerEmail,
					signedAt: now,
				})
				.where(eq(quotes.id, input.id))
				.returning();

			if (quote.dealId) {
				await ctx.db
					.update(deals)
					.set({ status: "WON", updatedAt: now })
					.where(eq(deals.id, quote.dealId));
			}

			await emitDomainEvent(ctx.db, {
				type: "quote.accepted",
				organizationId: quote.organizationId,
				targetEntityId: quote.id,
				payload: {
					quoteId: quote.id,
					quoteNumber: quote.quoteNumber,
					totalAmount: quote.totalAmount,
					signatureName: input.signatureName,
					companyId: quote.companyId,
					dealId: quote.dealId,
				},
			});

			return { success: true, quote: signed };
		}),

	getPublicQuote: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const quote = await ctx.db.query.quotes.findFirst({
				where: eq(quotes.id, input.id),
				with: {
					organization: true,
					company: true,
				},
			});

			if (!quote) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Quote not found",
				});
			}

			if (quote.status === "DRAFT") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This quote is not ready for viewing yet.",
				});
			}

			return quote;
		}),

	getPublicInvoice: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const invoice = await ctx.db.query.invoices.findFirst({
				where: eq(invoices.id, input.id),
				with: {
					organization: true,
					company: true,
				},
			});

			if (!invoice) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Invoice not found",
				});
			}

			const paymentsList = await ctx.db.query.payments.findMany({
				where: eq(payments.invoiceId, invoice.id),
			});

			if (invoice.status === "DRAFT") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This invoice is not ready for viewing yet.",
				});
			}

			return {
				...invoice,
				payments: paymentsList,
			};
		}),

	getPublicStatement: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const statement = await ctx.db.query.statements.findFirst({
				where: eq(statements.id, input.id),
				with: {
					organization: true,
					company: true,
				},
			});

			if (!statement) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Statement not found",
				});
			}

			return statement;
		}),

	getCatalogue: publicProcedure
		.input(z.object({ orgId: z.string() }))
		.query(async ({ ctx, input }) => {
			const org = await ctx.db.query.organizations.findFirst({
				where: eq(ctx.db.schema.organizations.id, input.orgId),
			});
			if (!org) throw new TRPCError({ code: "NOT_FOUND" });

			const catalogProducts = await ctx.db.query.products.findMany({
				where: and(
					eq(ctx.db.schema.products.organizationId, input.orgId),
					eq(ctx.db.schema.products.isPublic, true),
				),
			});

			return {
				organization: org,
				products: catalogProducts,
			};
		}),

	submitQuoteRequest: publicProcedure
		.input(
			z.object({
				orgId: z.string(),
				name: z.string().min(1),
				email: z.string().email(),
				phone: z.string().optional(),
				items: z
					.array(
						z.object({
							productId: z.string(),
							quantity: z.number().int().min(1),
							price: z.number().optional(),
						}),
					)
					.min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { orgId, name, email, phone, items } = input;

			// Verify organization exists and is active
			const org = await ctx.db.query.organizations.findFirst({
				where: eq(ctx.db.schema.organizations.id, orgId),
			});
			if (!org || !org.isActive) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Organization not found or inactive",
				});
			}

			// Upsert contact based on email
			let contact = await ctx.db.query.contacts.findFirst({
				where: and(
					eq(ctx.db.schema.contacts.organizationId, orgId),
					eq(ctx.db.schema.contacts.email, email),
				),
			});

			if (!contact) {
				const parts = name.trim().split(" ");
				const [newContact] = await ctx.db
					.insert(ctx.db.schema.contacts)
					.values({
						organizationId: orgId,
						firstName: parts[0] || name,
						lastName: parts.slice(1).join(" "),
						email: email,
						phone: phone,
						source: "PUBLIC_CATALOGUE",
					})
					.returning();
				contact = newContact;
			}

			// Fetch authentic products from database to prevent price manipulation
			const productIds = items.map((i) => i.productId);
			const dbProducts = await ctx.db.query.products.findMany({
				where: and(
					eq(ctx.db.schema.products.organizationId, orgId),
					inArray(ctx.db.schema.products.id, productIds),
				),
			});
			const productMap = new Map(dbProducts.map((p) => [p.id, p]));

			let totalAmount = 0;
			for (const item of items) {
				const product = productMap.get(item.productId);
				// If product exists in database, use its authentic unitPrice; otherwise fallback to non-negative item price
				const unitPrice = product
					? product.unitPrice
					: Math.max(0, item.price || 0);
				totalAmount += unitPrice * item.quantity;
			}

			const quoteNumber = `QTR-${Date.now().toString().slice(-6)}`;

			// Create Quote
			const [quote] = await ctx.db
				.insert(ctx.db.schema.quotes)
				.values({
					organizationId: orgId,
					quoteNumber,
					companyId: contact.companyId,
					contactId: contact.id,
					status: "REQUESTED",
					subtotal: totalAmount,
					totalAmount: totalAmount,
				})
				.returning();

			// Create Notification for the org
			const orgUsers = await ctx.db.query.organizationMembers.findMany({
				where: eq(ctx.db.schema.organizationMembers.organizationId, orgId),
			});

			for (const member of orgUsers) {
				await ctx.db.insert(ctx.db.schema.notifications).values({
					organizationId: orgId,
					userId: member.userId,
					title: "New Quote Request",
					message: `${name} requested a quote for ${items.length} items.`,
					link: `/crm/quotes/${quote.id}`,
				});
			}

			return { success: true, quoteId: quote.id };
		}),
});
