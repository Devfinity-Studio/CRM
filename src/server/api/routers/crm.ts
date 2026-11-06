import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, resolveTenantContext } from "~/server/api/trpc";
import {
	activityNotes,
	assignmentHistory,
	companies,
	contacts,
	deals,
	invoices,
	organizationMembers,
	quotes,
	tags,
} from "~/server/db/schema";
import {
	decryptPII,
	encryptPII,
	maskAadhaar,
	maskPan,
	maskPassport,
} from "~/server/security/encryption";
import { dispatchWebhook } from "~/server/webhooks/dispatch";
export const crmRouter = createTRPCRouter({
	// Contacts / POC Procedures
	getContacts: protectedProcedure.query(async ({ ctx }) => {
		const tenant = await resolveTenantContext(ctx);

		const rows = await ctx.db
			.select()
			.from(contacts)
			.where(eq(contacts.organizationId, tenant.organizationId))
			.orderBy(desc(contacts.createdAt));

		return rows.map((c) => {
			const panDec = c.pan ? decryptPII(c.pan) : null;
			const aadhaarDec = c.aadhaar ? decryptPII(c.aadhaar) : null;
			const passportDec = c.passport ? decryptPII(c.passport) : null;
			return {
				...c,
				pan: panDec,
				aadhaar: aadhaarDec,
				passport: passportDec,
				panMasked: maskPan(panDec),
				aadhaarMasked: maskAadhaar(aadhaarDec),
				passportMasked: maskPassport(passportDec),
			};
		});
	}),

	getPOCsByCompanyId: protectedProcedure
		.input(z.object({ companyId: z.string() }))
		.query(async ({ ctx, input }) => {
			const tenant = await resolveTenantContext(ctx);

			const rows = await ctx.db
				.select()
				.from(contacts)
				.where(
					and(
						eq(contacts.organizationId, tenant.organizationId),
						eq(contacts.companyId, input.companyId),
					),
				)
				.orderBy(desc(contacts.createdAt));

			return rows.map((c) => {
				const panDec = c.pan ? decryptPII(c.pan) : null;
				const aadhaarDec = c.aadhaar ? decryptPII(c.aadhaar) : null;
				const passportDec = c.passport ? decryptPII(c.passport) : null;
				return {
					...c,
					pan: panDec,
					aadhaar: aadhaarDec,
					passport: passportDec,
					panMasked: maskPan(panDec),
					aadhaarMasked: maskAadhaar(aadhaarDec),
					passportMasked: maskPassport(passportDec),
				};
			});
		}),

	createContact: protectedProcedure
		.input(
			z.object({
				companyId: z.string().optional(),
				salutation: z.string().optional(),
				firstName: z.string().min(1),
				lastName: z.string().optional(),
				email: z.string().email().optional().or(z.literal("")),
				phone: z.string().optional(),
				additionalEmails: z.any().optional(),
				additionalPhones: z.any().optional(),
				pan: z.string().optional(),
				aadhaar: z.string().optional(),
				passport: z.string().optional(),
				socialLinks: z.any().optional(),
				addressCountry: z.string().optional(),
				addressState: z.string().optional(),
				addressDistrict: z.string().optional(),
				addressCity: z.string().optional(),
				addressBuilding: z.string().optional(),
				addressStreet: z.string().optional(),
				addressZip: z.string().optional(),
				leadScore: z.number().int().optional().default(0),
				qualificationStatus: z
					.enum(["NONE", "MQL", "SQL", "DISQUALIFIED"])
					.optional()
					.default("NONE"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const tenant = await resolveTenantContext(ctx);

			// Auto-generate a simple UID
			const countResult = await ctx.db
				.select({ count: sql<number>`count(*)` })
				.from(contacts)
				.where(eq(contacts.organizationId, tenant.organizationId));
			const count = Number(countResult[0]?.count || 0) + 1;
			const uid = `POC-${String(count).padStart(4, "0")}`;

			const [contact] = await ctx.db
				.insert(contacts)
				.values({
					...input,
					pan: input.pan ? encryptPII(input.pan) : input.pan,
					aadhaar: input.aadhaar ? encryptPII(input.aadhaar) : input.aadhaar,
					passport: input.passport ? encryptPII(input.passport) : input.passport,
					organizationId: tenant.organizationId,
					uid,
				})
				.returning();

			// Dispatch webhook
			await dispatchWebhook(tenant.organizationId, "client.added", { contact });

			return contact;
		}),

	getCompanies: protectedProcedure.query(async ({ ctx }) => {
		const tenant = await resolveTenantContext(ctx);

		const rows = await ctx.db
			.select()
			.from(companies)
			.where(eq(companies.organizationId, tenant.organizationId))
			.orderBy(desc(companies.createdAt));

		return rows.map((comp) => {
			const decPan = comp.businessPan ? decryptPII(comp.businessPan) : null;
			return {
				...comp,
				businessPan: decPan,
				businessPanMasked: maskPan(decPan),
			};
		});
	}),

	getCompanyByName: protectedProcedure
		.input(z.object({ name: z.string() }))
		.query(async ({ ctx, input }) => {
			const tenant = await resolveTenantContext(ctx);

			if (!input.name || input.name.trim() === "") return null;

			const [company] = await ctx.db
				.select()
				.from(companies)
				.where(
					and(
						eq(companies.organizationId, tenant.organizationId),
						// case-insensitive match
						ilike(companies.name, input.name.trim()),
					),
				)
				.limit(1);

			if (!company) return null;
			const decPan = company.businessPan ? decryptPII(company.businessPan) : null;
			return {
				...company,
				businessPan: decPan,
				businessPanMasked: maskPan(decPan),
			};
		}),

	getCompanyById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const tenant = await resolveTenantContext(ctx);

			const [company] = await ctx.db
				.select()
				.from(companies)
				.where(
					and(
						eq(companies.organizationId, tenant.organizationId),
						eq(companies.id, input.id),
					),
				)
				.limit(1);

			if (!company) return null;
			const decPan = company.businessPan ? decryptPII(company.businessPan) : null;
			return {
				...company,
				businessPan: decPan,
				businessPanMasked: maskPan(decPan),
			};
		}),

	createCompany: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				logoUrl: z.string().optional(),
				domain: z.string().optional(),
				industry: z.string().optional(),
				employeeCount: z.number().optional(),
				teamSize: z.string().optional(),
				phone: z.string().optional(),
				countryCode: z.string().optional(),
				country: z.string().optional(),
				currency: z.string().optional(),
				hasGst: z.boolean().default(false),
				gstin: z.string().optional(),
				businessPan: z.string().optional(),
				businessType: z.string().optional(),
				useCases: z.string().optional(), // storing array as string or JSON
				addressStreet: z.string().optional(),
				addressCity: z.string().optional(),
				addressState: z.string().optional(),
				addressCountry: z.string().optional(),
				addressPincode: z.string().optional(),
				address: z.string().optional(),
				clientType: z.string().optional(),
				taxTreatment: z.string().optional(),
				extraIds: z.any().optional(),
				shippingDetails: z.any().optional(),
				alias: z.string().optional(),
				uid: z.string().optional(),
				email: z.string().optional(),
				showEmailInInvoice: z.boolean().default(false),
				showPhoneInInvoice: z.boolean().default(false),
				paymentDueDays: z.number().optional(),
				customFields: z.any().optional(),
				attachments: z.any().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const tenant = await resolveTenantContext(ctx);

			const [company] = await ctx.db
				.insert(companies)
				.values({
					...input,
					businessPan: input.businessPan
						? encryptPII(input.businessPan)
						: input.businessPan,
					organizationId: tenant.organizationId,
				})
				.returning();

			await dispatchWebhook(tenant.organizationId, "company.added", {
				company,
			});

			return company;
		}),

	// Activity Notes Procedures
	getActivityNotes: protectedProcedure
		.input(
			z
				.object({
					companyId: z.string().optional(),
					dealId: z.string().optional(),
					contactId: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const tenant = await resolveTenantContext(ctx);

			const conditions = [
				eq(activityNotes.organizationId, tenant.organizationId),
			];
			if (input?.companyId) {
				conditions.push(eq(activityNotes.companyId, input.companyId));
			}
			if (input?.dealId) {
				conditions.push(eq(activityNotes.dealId, input.dealId));
			}
			if (input?.contactId) {
				conditions.push(eq(activityNotes.contactId, input.contactId));
			}
			return ctx.db
				.select()
				.from(activityNotes)
				.where(and(...conditions))
				.orderBy(desc(activityNotes.createdAt));
		}),

	addActivityNote: protectedProcedure
		.input(
			z.object({
				companyId: z.string().optional(),
				dealId: z.string().optional(),
				contactId: z.string().optional(),
				type: z.string().default("NOTE"),
				content: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const tenant = await resolveTenantContext(ctx);

			const [note] = await ctx.db
				.insert(activityNotes)
				.values({
					...input,
					organizationId: tenant.organizationId,
					authorId: ctx.session.user.id,
				})
				.returning();
			return note;
		}),

	// 360° Unified Chronological Timeline across Notes, Deals, Quotes & Invoices with LTV calculation
	getUnifiedTimeline: protectedProcedure
		.input(
			z.object({
				companyId: z.string().optional(),
				contactId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const tenant = await resolveTenantContext(ctx);
			const orgId = tenant.organizationId;

			// 1. Fetch Notes
			const noteConditions = [eq(activityNotes.organizationId, orgId)];
			if (input.companyId) noteConditions.push(eq(activityNotes.companyId, input.companyId));
			if (input.contactId) noteConditions.push(eq(activityNotes.contactId, input.contactId));
			const notes = await ctx.db.select().from(activityNotes).where(and(...noteConditions));

			// 2. Fetch Deals
			const dealConditions = [eq(deals.organizationId, orgId)];
			if (input.companyId) dealConditions.push(eq(deals.companyId, input.companyId));
			if (input.contactId) dealConditions.push(eq(deals.contactId, input.contactId));
			const companyDeals = await ctx.db.select().from(deals).where(and(...dealConditions));

			// 3. Fetch Quotes
			let companyQuotes: any[] = [];
			if (input.companyId) {
				companyQuotes = await ctx.db
					.select()
					.from(quotes)
					.where(and(eq(quotes.organizationId, orgId), eq(quotes.companyId, input.companyId)));
			}

			// 4. Fetch Invoices
			let companyInvoices: any[] = [];
			if (input.companyId) {
				companyInvoices = await ctx.db
					.select()
					.from(invoices)
					.where(and(eq(invoices.organizationId, orgId), eq(invoices.companyId, input.companyId)));
			}

			// Calculate Real-Time LTV & Metrics
			const totalPaidRevenue = companyInvoices
				.filter((inv) => inv.status === "PAID" || inv.amountPaid > 0)
				.reduce((acc, inv) => acc + (inv.amountPaid || inv.totalAmount || 0), 0);

			const wonDealsValue = companyDeals
				.filter((d) => d.status === "WON")
				.reduce((acc, d) => acc + (d.value || 0), 0);

			const openPipelineValue = companyDeals
				.filter((d) => d.status === "OPEN")
				.reduce((acc, d) => acc + (d.value || 0), 0);

			// Assemble unified chronological events
			const events = [
				...notes.map((n) => ({
					id: `note-${n.id}`,
					category: "NOTE" as const,
					subtype: n.type,
					title: `${n.type.charAt(0).toUpperCase() + n.type.slice(1).toLowerCase()} Logged`,
					content: n.content,
					createdAt: n.createdAt,
				})),
				...companyDeals.map((d) => ({
					id: `deal-${d.id}`,
					category: "DEAL" as const,
					subtype: d.status,
					title: `Deal: ${d.title}`,
					content: `Status: ${d.status} • Value: ${(d.value / 100).toLocaleString()}`,
					amount: d.value,
					createdAt: d.createdAt,
				})),
				...companyQuotes.map((q) => ({
					id: `quote-${q.id}`,
					category: "QUOTE" as const,
					subtype: q.status,
					title: `Proposal #${q.quoteNumber}`,
					content: q.signedAt
						? `Digitally signed by ${q.signatureName || "Client"} on ${new Date(q.signedAt).toLocaleDateString()}`
						: `Status: ${q.status} • Total: ${(q.totalAmount / 100).toLocaleString()}`,
					amount: q.totalAmount,
					createdAt: q.createdAt,
				})),
				...companyInvoices.map((inv) => ({
					id: `invoice-${inv.id}`,
					category: "INVOICE" as const,
					subtype: inv.status,
					title: `Invoice #${inv.invoiceNumber}`,
					content: `Status: ${inv.status} • Total: ${(inv.totalAmount / 100).toLocaleString()} (Paid: ${(inv.amountPaid / 100).toLocaleString()})`,
					amount: inv.totalAmount,
					createdAt: inv.createdAt,
				})),
			].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

			return {
				events,
				ltv: {
					totalPaidRevenue,
					wonDealsValue,
					openPipelineValue,
					totalInvoicesCount: companyInvoices.length,
					totalDealsCount: companyDeals.length,
					totalQuotesCount: companyQuotes.length,
				},
			};
		}),
});
