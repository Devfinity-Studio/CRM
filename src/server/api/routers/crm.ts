import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	activityNotes,
	assignmentHistory,
	companies,
	contacts,
	organizationMembers,
	tags,
} from "~/server/db/schema";
import { dispatchWebhook } from "~/server/webhooks/dispatch";
export const crmRouter = createTRPCRouter({
	// Contacts / POC Procedures
	getContacts: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");

		return ctx.db
			.select()
			.from(contacts)
			.where(eq(contacts.organizationId, member.organizationId))
			.orderBy(desc(contacts.createdAt));
	}),

	getPOCsByCompanyId: protectedProcedure
		.input(z.object({ companyId: z.string() }))
		.query(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			return ctx.db
				.select()
				.from(contacts)
				.where(
					and(
						eq(contacts.organizationId, member.organizationId),
						eq(contacts.companyId, input.companyId),
					),
				)
				.orderBy(desc(contacts.createdAt));
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
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			// Auto-generate a simple UID
			const countResult = await ctx.db
				.select({ count: sql<number>`count(*)` })
				.from(contacts)
				.where(eq(contacts.organizationId, member.organizationId));
			const count = Number(countResult[0]?.count || 0) + 1;
			const uid = `POC-${String(count).padStart(4, "0")}`;

			const [contact] = await ctx.db
				.insert(contacts)
				.values({
					...input,
					organizationId: member.organizationId,
					uid,
				})
				.returning();

			// Dispatch webhook
			await dispatchWebhook(member.organizationId, "client.added", { contact });

			return contact;
		}),

	getCompanies: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");

		return ctx.db
			.select()
			.from(companies)
			.where(eq(companies.organizationId, member.organizationId))
			.orderBy(desc(companies.createdAt));
	}),

	getCompanyByName: protectedProcedure
		.input(z.object({ name: z.string() }))
		.query(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			if (!input.name || input.name.trim() === "") return null;

			const [company] = await ctx.db
				.select()
				.from(companies)
				.where(
					and(
						eq(companies.organizationId, member.organizationId),
						// case-insensitive match
						ilike(companies.name, input.name.trim()),
					),
				)
				.limit(1);

			return company || null;
		}),

	getCompanyById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const [company] = await ctx.db
				.select()
				.from(companies)
				.where(
					and(
						eq(companies.organizationId, member.organizationId),
						eq(companies.id, input.id),
					),
				)
				.limit(1);

			return company || null;
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
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const [company] = await ctx.db
				.insert(companies)
				.values({ ...input, organizationId: member.organizationId })
				.returning();

			await dispatchWebhook(member.organizationId, "company.added", {
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
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const conditions = [
				eq(activityNotes.organizationId, member.organizationId),
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
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const [note] = await ctx.db
				.insert(activityNotes)
				.values({
					...input,
					organizationId: member.organizationId,
					authorId: ctx.session.user.id,
				})
				.returning();
			return note;
		}),
});
