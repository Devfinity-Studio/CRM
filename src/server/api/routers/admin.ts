import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
	superAdminProcedure,
} from "~/server/api/trpc";
import {
	organizations,
	subscriptionPlans,
	subscriptions,
	users,
} from "~/server/db/schema";

export const adminRouter = createTRPCRouter({
	// Get all subscription plans
	getPlans: publicProcedure.query(async ({ ctx }) => {
		return ctx.db
			.select()
			.from(subscriptionPlans)
			.orderBy(desc(subscriptionPlans.createdAt));
	}),

	// Create a subscription plan (Super Admin only)
	createPlan: superAdminProcedure
		.input(
			z.object({
				name: z.string().min(2),
				code: z.string().min(2),
				description: z.string().optional(),
				priceMonthly: z.number().min(0),
				priceYearly: z.number().min(0),
				maxUsers: z.number().min(1),
				maxContacts: z.number().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [plan] = await ctx.db
				.insert(subscriptionPlans)
				.values(input)
				.returning();
			return plan;
		}),

	// Get all client organizations (Super Admin only)
	getOrganizations: superAdminProcedure.query(async ({ ctx }) => {
		const orgs = await ctx.db
			.select()
			.from(organizations)
			.orderBy(desc(organizations.createdAt));
		return orgs;
	}),

	// Create organization tenant and assign plan
	createOrganization: superAdminProcedure
		.input(
			z.object({
				name: z.string().min(2),
				slug: z.string().min(2),
				planId: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [org] = await ctx.db
				.insert(organizations)
				.values({
					name: input.name,
					slug: input.slug,
				})
				.returning();

			if (org) {
				const startDate = new Date();
				const endDate = new Date();
				endDate.setMonth(endDate.getMonth() + 1);

				await ctx.db.insert(subscriptions).values({
					organizationId: org.id,
					planId: input.planId,
					status: "ACTIVE",
					currentPeriodStart: startDate,
					currentPeriodEnd: endDate,
				});
			}

			return org;
		}),

	// Super Admin Stats Summary
	getAdminStats: superAdminProcedure.query(async ({ ctx }) => {
		const allUsers = await ctx.db.select().from(users);
		const allOrgs = await ctx.db.select().from(organizations);
		const allPlans = await ctx.db.select().from(subscriptionPlans);

		return {
			totalUsers: allUsers.length,
			totalOrganizations: allOrgs.length,
			totalPlans: allPlans.length,
		};
	}),
});
