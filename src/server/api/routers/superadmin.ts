import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import {
	DEFAULT_GLOBAL_FEATURE_FLAGS,
	type FeatureKey,
	getGlobalFeatureFlags,
	getTenantEntitlements,
} from "~/server/api/services/entitlements";
import {
	createPlatformCheckoutSession,
} from "~/server/api/services/platform-billing";
import { createTRPCRouter, superAdminProcedure } from "~/server/api/trpc";
import {
	globalSettings,
	organizations,
	payments,
	subscriptionPlans,
	subscriptions,
	tenantOverrides,
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
			errorRate: "0.2%",
			activeSessions: Math.floor(allUsers.length * 0.4) + 1,
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

	// --- SAAS PLAN BUILDER PROCEDURES ---
	getPlans: superAdminProcedure.query(async ({ ctx }) => {
		return ctx.db.query.subscriptionPlans.findMany({
			orderBy: (plans, { asc }) => [asc(plans.priceMonthly)],
		});
	}),

	createPlan: superAdminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				code: z.string().min(1),
				description: z.string().optional(),
				priceMonthly: z.number().min(0),
				priceYearly: z.number().min(0),
				maxUsers: z.number().min(1).default(5),
				maxContacts: z.number().min(1).default(1000),
				maxInvoicesPerMonth: z.number().min(1).default(100),
				maxAutomationsPerMonth: z.number().min(1).default(500),
				maxStorageMb: z.number().min(1).default(1024),
				hasInventory: z.boolean().default(true),
				hasSubscriptions: z.boolean().default(true),
				hasAutomations: z.boolean().default(true),
				hasCustomDomains: z.boolean().default(false),
				hasWebhooks: z.boolean().default(false),
				hasApiKeys: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [plan] = await ctx.db
				.insert(subscriptionPlans)
				.values({
					name: input.name,
					code: input.code.toLowerCase().trim(),
					description: input.description,
					priceMonthly: Math.round(input.priceMonthly),
					priceYearly: Math.round(input.priceYearly),
					maxUsers: input.maxUsers,
					maxContacts: input.maxContacts,
					maxInvoicesPerMonth: input.maxInvoicesPerMonth,
					maxAutomationsPerMonth: input.maxAutomationsPerMonth,
					maxStorageMb: input.maxStorageMb,
					hasInventory: input.hasInventory,
					hasSubscriptions: input.hasSubscriptions,
					hasAutomations: input.hasAutomations,
					hasCustomDomains: input.hasCustomDomains,
					hasWebhooks: input.hasWebhooks,
					hasApiKeys: input.hasApiKeys,
				})
				.returning();

			return plan;
		}),

	updatePlan: superAdminProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
				priceMonthly: z.number().min(0).optional(),
				priceYearly: z.number().min(0).optional(),
				maxUsers: z.number().min(1).optional(),
				maxContacts: z.number().min(1).optional(),
				maxInvoicesPerMonth: z.number().min(1).optional(),
				maxAutomationsPerMonth: z.number().min(1).optional(),
				maxStorageMb: z.number().min(1).optional(),
				hasInventory: z.boolean().optional(),
				hasSubscriptions: z.boolean().optional(),
				hasAutomations: z.boolean().optional(),
				hasCustomDomains: z.boolean().optional(),
				hasWebhooks: z.boolean().optional(),
				hasApiKeys: z.boolean().optional(),
				isActive: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updates } = input;
			const [updated] = await ctx.db
				.update(subscriptionPlans)
				.set(updates)
				.where(eq(subscriptionPlans.id, id))
				.returning();

			return updated;
		}),

	// --- PER-TENANT OVERRIDES PROCEDURES ---
	getTenantOverrides: superAdminProcedure
		.input(z.object({ organizationId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.query.tenantOverrides.findFirst({
				where: eq(tenantOverrides.organizationId, input.organizationId),
			});
		}),

	upsertTenantOverrides: superAdminProcedure
		.input(
			z.object({
				organizationId: z.string(),
				featureOverrides: z.record(z.boolean()).optional(),
				quotaOverrides: z.record(z.number()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.query.tenantOverrides.findFirst({
				where: eq(tenantOverrides.organizationId, input.organizationId),
			});

			const featStr = input.featureOverrides
				? JSON.stringify(input.featureOverrides)
				: null;
			const quotaStr = input.quotaOverrides
				? JSON.stringify(input.quotaOverrides)
				: null;

			if (existing) {
				const [updated] = await ctx.db
					.update(tenantOverrides)
					.set({
						featureOverrides: featStr ?? existing.featureOverrides,
						quotaOverrides: quotaStr ?? existing.quotaOverrides,
					})
					.where(eq(tenantOverrides.id, existing.id))
					.returning();
				return updated;
			}

			const [created] = await ctx.db
				.insert(tenantOverrides)
				.values({
					organizationId: input.organizationId,
					featureOverrides: featStr,
					quotaOverrides: quotaStr,
				})
				.returning();

			return created;
		}),

	assignTenantPlan: superAdminProcedure
		.input(
			z.object({
				organizationId: z.string(),
				planId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.update(organizations)
				.set({ planId: input.planId })
				.where(eq(organizations.id, input.organizationId));

			return { success: true };
		}),

	createTenantCheckoutSession: superAdminProcedure
		.input(
			z.object({
				organizationId: z.string(),
				planId: z.string(),
				billingCycle: z.enum(["monthly", "yearly"]),
				customerEmail: z.string().email(),
				customerName: z.string(),
				returnUrl: z.string().url(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return createPlatformCheckoutSession(ctx.db, input);
		}),

	getGlobalFeatureFlags: superAdminProcedure.query(async ({ ctx }) => {
		return getGlobalFeatureFlags(ctx.db);
	}),

	updateGlobalFeatureFlags: superAdminProcedure
		.input(
			z.record(z.boolean()),
		)
		.mutation(async ({ ctx, input }) => {
			const currentFlags = await getGlobalFeatureFlags(ctx.db);
			const updated = {
				...currentFlags,
				...input,
			};

			let settings = await ctx.db.query.globalSettings.findFirst({
				where: eq(globalSettings.id, "default"),
			});

			if (!settings) {
				await ctx.db.insert(globalSettings).values({
					id: "default",
					featureFlags: JSON.stringify(updated),
				});
			} else {
				await ctx.db
					.update(globalSettings)
					.set({ featureFlags: JSON.stringify(updated) })
					.where(eq(globalSettings.id, "default"));
			}

			return updated;
		}),

	getTenantFeatureMatrix: superAdminProcedure.query(async ({ ctx }) => {
		const orgs = await ctx.db.query.organizations.findMany({
			orderBy: (o, { desc }) => [desc(o.createdAt)],
		});

		const globalFlags = await getGlobalFeatureFlags(ctx.db);

		const results = await Promise.all(
			orgs.map(async (org) => {
				const entitlements = await getTenantEntitlements(ctx.db, org.id);
				const override = await ctx.db.query.tenantOverrides.findFirst({
					where: eq(tenantOverrides.organizationId, org.id),
				});

				let parsedOverrides: Partial<Record<FeatureKey, boolean>> = {};
				if (override?.featureOverrides) {
					try {
						parsedOverrides = JSON.parse(override.featureOverrides);
					} catch {}
				}

				return {
					id: org.id,
					name: org.name,
					slug: org.slug,
					planName: entitlements.planName,
					planCode: entitlements.planCode,
					features: entitlements.features,
					overrides: parsedOverrides,
				};
			}),
		);

		return {
			globalFlags,
			tenants: results,
		};
	}),

	setTenantFeatureOverride: superAdminProcedure
		.input(
			z.object({
				organizationId: z.string(),
				featureKey: z.enum([
					"hasInventory",
					"hasSubscriptions",
					"hasAutomations",
					"hasCustomDomains",
					"hasWebhooks",
					"hasApiKeys",
					"hasQuotes",
					"hasInvoicing",
					"hasAiInsights",
				]),
				value: z.boolean().nullable(), // null means reset to plan/global default
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.query.tenantOverrides.findFirst({
				where: eq(tenantOverrides.organizationId, input.organizationId),
			});

			let currentOverrides: Partial<Record<string, boolean>> = {};
			if (existing?.featureOverrides) {
				try {
					currentOverrides = JSON.parse(existing.featureOverrides);
				} catch {}
			}

			if (input.value === null) {
				delete currentOverrides[input.featureKey];
			} else {
				currentOverrides[input.featureKey] = input.value;
			}

			const featStr =
				Object.keys(currentOverrides).length > 0
					? JSON.stringify(currentOverrides)
					: null;

			if (existing) {
				await ctx.db
					.update(tenantOverrides)
					.set({ featureOverrides: featStr })
					.where(eq(tenantOverrides.id, existing.id));
			} else if (featStr) {
				await ctx.db.insert(tenantOverrides).values({
					organizationId: input.organizationId,
					featureOverrides: featStr,
				});
			}

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
