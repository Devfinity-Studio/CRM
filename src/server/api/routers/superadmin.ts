import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { createTRPCRouter, superAdminProcedure } from "~/server/api/trpc";
import {
	globalSettings,
	organizations,
	payments,
	users,
} from "~/server/db/schema";

export const superadminRouter = createTRPCRouter({
	getOrganizations: superAdminProcedure.query(async ({ ctx }) => {
		return ctx.db.query.organizations.findMany({
			orderBy: (orgs, { desc }) => [desc(orgs.name)],
		});
	}),

	getUsers: superAdminProcedure.query(async ({ ctx }) => {
		return ctx.db.query.users.findMany({
			orderBy: (u, { desc }) => [desc(u.createdAt)],
		});
	}),

	impersonateOrganization: superAdminProcedure
		.input(z.object({ orgId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Check if org exists
			const org = await ctx.db.query.organizations.findFirst({
				where: eq(organizations.id, input.orgId),
			});

			if (!org) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Organization not found",
				});
			}

			const cookieStore = await cookies();
			cookieStore.set("devcrm_impersonate_org", input.orgId, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
			});

			return { success: true, orgName: org.name };
		}),

	stopImpersonation: superAdminProcedure.mutation(async ({ ctx }) => {
		const cookieStore = await cookies();
		cookieStore.delete("devcrm_impersonate_org");

		return { success: true };
	}),

	getPlatformHealth: superAdminProcedure.query(async ({ ctx }) => {
		const allOrgs = await ctx.db.select().from(organizations);
		const allUsers = await ctx.db.select().from(users);
		const allPayments = await ctx.db.select().from(payments);

		const totalRevenue = allPayments.reduce(
			(acc, curr) => acc + (curr.amount || 0),
			0,
		);

		return {
			totalOrganizations: allOrgs.length,
			totalUsers: allUsers.length,
			globalRevenue: totalRevenue,
			errorRate: "0.4%", // Mocked for MVP
			activeSessions: Math.floor(allUsers.length * 0.3) + 1, // Mocked active sessions
		};
	}),

	toggleOrganizationStatus: superAdminProcedure
		.input(z.object({ orgId: z.string(), isActive: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.update(organizations)
				.set({ isActive: input.isActive })
				.where(eq(organizations.id, input.orgId));
			return { success: true };
		}),

	deleteOrganization: superAdminProcedure
		.input(z.object({ orgId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(organizations)
				.where(eq(organizations.id, input.orgId));
			return { success: true };
		}),

	getGlobalSettings: superAdminProcedure.query(async ({ ctx }) => {
		let settings = await ctx.db.query.globalSettings.findFirst();
		if (!settings) {
			const [newSettings] = await ctx.db
				.insert(globalSettings)
				.values({ id: "default" })
				.returning();
			settings = newSettings;
		}
		return settings;
	}),

	updateGlobalSettings: superAdminProcedure
		.input(
			z.object({
				maintenanceMode: z.boolean().optional(),
				enableBetaFeatures: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [settings] = await ctx.db
				.update(globalSettings)
				.set(input)
				.where(eq(globalSettings.id, "default"))
				.returning();
			return settings;
		}),
});
