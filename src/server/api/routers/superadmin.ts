import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "~/env";
import { svix } from "~/lib/svix";
import {
	DEFAULT_GLOBAL_FEATURE_FLAGS,
	type FeatureKey,
	getGlobalFeatureFlags,
	getTenantEntitlements,
} from "~/server/api/services/entitlements";
import {
	checkDodoHealth,
	checkEmailHealth,
	checkStorageHealth,
	checkSvixHealth,
	getAllIntegrationsHealth,
} from "~/server/api/services/integrations-health";
import {
	createPlatformCheckoutSession,
} from "~/server/api/services/platform-billing";
import { createTRPCRouter, superAdminProcedure } from "~/server/api/trpc";
import {
	companies,
	contacts,
	deals,
	globalSettings,
	invoices,
	organizationMembers,
	organizations,
	payments,
	subscriptionPlans,
	subscriptions,
	systemAuditLogs,
	tenantOverrides,
	users,
} from "~/server/db/schema";
import { logSuperAdminAction } from "~/server/security/audit";

export const superadminRouter = createTRPCRouter({
	getOrganizations: superAdminProcedure.query(async ({ ctx }) => {
		return ctx.db.query.organizations.findMany({
			orderBy: (orgs, { desc }) => [desc(orgs.name)],
		});
	}),

	getUsers: superAdminProcedure.query(async ({ ctx }) => {
		return ctx.db.query.users.findMany({
			columns: {
				passwordHash: false,
			},
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

			await logSuperAdminAction(ctx.db, {
				actorId: ctx.session.user.id,
				actorEmail: ctx.session.user.email || "superadmin@devcrm.io",
				action: "IMPERSONATE_ORG",
				targetType: "ORGANIZATION",
				targetId: input.orgId,
				metadata: { organizationName: org.name, slug: org.slug },
			});

			return { success: true, orgName: org.name };
		}),

	stopImpersonation: superAdminProcedure.mutation(async ({ ctx }) => {
		const cookieStore = await cookies();
		cookieStore.delete("devcrm_impersonate_org");

		await logSuperAdminAction(ctx.db, {
			actorId: ctx.session.user.id,
			actorEmail: ctx.session.user.email || "superadmin@devcrm.io",
			action: "STOP_IMPERSONATION",
			targetType: "ORGANIZATION",
		});

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

			await logSuperAdminAction(ctx.db, {
				actorId: ctx.session.user.id,
				actorEmail: ctx.session.user.email || "superadmin@devcrm.io",
				action: "CREATE_PLAN",
				targetType: "PLAN",
				targetId: plan.id,
				metadata: { name: plan.name, code: plan.code },
			});

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

			await logSuperAdminAction(ctx.db, {
				actorId: ctx.session.user.id,
				actorEmail: ctx.session.user.email || "superadmin@devcrm.io",
				action: "UPDATE_PLAN",
				targetType: "PLAN",
				targetId: id,
				metadata: updates,
			});

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

			let result: any = null;
			if (existing) {
				const [updated] = await ctx.db
					.update(tenantOverrides)
					.set({
						featureOverrides: featStr ?? existing.featureOverrides,
						quotaOverrides: quotaStr ?? existing.quotaOverrides,
					})
					.where(eq(tenantOverrides.id, existing.id))
					.returning();
				result = updated;
			} else {
				const [created] = await ctx.db
					.insert(tenantOverrides)
					.values({
						organizationId: input.organizationId,
						featureOverrides: featStr,
						quotaOverrides: quotaStr,
					})
					.returning();
				result = created;
			}

			await logSuperAdminAction(ctx.db, {
				actorId: ctx.session.user.id,
				actorEmail: ctx.session.user.email || "superadmin@devcrm.io",
				action: "UPSERT_TENANT_OVERRIDES",
				targetType: "ORGANIZATION",
				targetId: input.organizationId,
				metadata: {
					featureOverrides: input.featureOverrides,
					quotaOverrides: input.quotaOverrides,
				},
			});

			return result;
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

			await logSuperAdminAction(ctx.db, {
				actorId: ctx.session.user.id,
				actorEmail: ctx.session.user.email || "superadmin@devcrm.io",
				action: "ASSIGN_TENANT_PLAN",
				targetType: "ORGANIZATION",
				targetId: input.organizationId,
				metadata: { planId: input.planId },
			});

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

			await logSuperAdminAction(ctx.db, {
				actorId: ctx.session.user.id,
				actorEmail: ctx.session.user.email || "superadmin@devcrm.io",
				action: "UPDATE_GLOBAL_FEATURE_FLAGS",
				targetType: "GLOBAL_SETTING",
				metadata: { flags: input },
			});

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

			await logSuperAdminAction(ctx.db, {
				actorId: ctx.session.user.id,
				actorEmail: ctx.session.user.email || "superadmin@devcrm.io",
				action: "SET_TENANT_FEATURE_OVERRIDE",
				targetType: "ORGANIZATION",
				targetId: input.organizationId,
				metadata: { featureKey: input.featureKey, value: input.value },
			});

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

			await logSuperAdminAction(ctx.db, {
				actorId: ctx.session.user.id,
				actorEmail: ctx.session.user.email || "superadmin@devcrm.io",
				action: "UPDATE_GLOBAL_SETTINGS",
				targetType: "GLOBAL_SETTING",
				metadata: input,
			});

			return settings;
		}),

	// --- INTEGRATION CENTER & SERVICE HEALTH MONITORING ---
	getIntegrationsHealth: superAdminProcedure.query(async () => {
		return getAllIntegrationsHealth();
	}),

	testDodoConnection: superAdminProcedure.mutation(async () => {
		return checkDodoHealth();
	}),

	testSvixConnection: superAdminProcedure.mutation(async () => {
		return checkSvixHealth();
	}),

	testStorageConnection: superAdminProcedure.mutation(async () => {
		return checkStorageHealth();
	}),

	testEmailConnection: superAdminProcedure.mutation(async () => {
		return checkEmailHealth();
	}),

	getSvixApplications: superAdminProcedure.query(async () => {
		try {
			if (env.SVIX_TOKEN === "test_sk_fake_token_for_devcrm" || !env.SVIX_TOKEN) {
				return {
					data: [],
					isMock: true,
					message: "Using mock SVIX_TOKEN",
				};
			}
			const apps = await svix.application.list({ limit: 25 });
			return {
				data: apps.data,
				isMock: false,
			};
		} catch (err: any) {
			return {
				data: [],
				isMock: false,
				error: err?.message || "Failed to list Svix applications",
			};
		}
	}),

	dispatchSvixTestWebhook: superAdminProcedure
		.input(
			z.object({
				appId: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			if (env.SVIX_TOKEN === "test_sk_fake_token_for_devcrm" || !env.SVIX_TOKEN) {
				return {
					success: true,
					mock: true,
					message: "Test webhook simulated (mock SVIX_TOKEN).",
					timestamp: new Date().toISOString(),
				};
			}

			try {
				let targetAppId = input.appId;
				if (!targetAppId) {
					const apps = await svix.application.list({ limit: 1 });
					if (apps.data.length > 0 && apps.data[0]) {
						targetAppId = apps.data[0].id;
					} else {
						const newApp = await svix.application.create({
							name: "SuperAdmin Diagnostic App",
							uid: `diag-${Date.now()}`,
						});
						targetAppId = newApp.id;
					}
				}

				const message = await svix.message.create(targetAppId, {
					eventType: "test.ping",
					payload: {
						test: true,
						triggeredAt: new Date().toISOString(),
						source: "SuperAdmin Integration Center",
					},
				});

				await logSuperAdminAction(ctx.db, {
					actorId: ctx.session.user.id,
					actorEmail: ctx.session.user.email || "superadmin@devcrm.io",
					action: "DISPATCH_TEST_WEBHOOK",
					targetType: "WEBHOOK",
					targetId: targetAppId,
				});

				return {
					success: true,
					mock: false,
					messageId: message.id,
					appId: targetAppId,
					timestamp: new Date().toISOString(),
				};
			} catch (err: any) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to dispatch test webhook: ${err?.message || "Unknown error"}`,
				});
			}
		}),

	getPlatformStorageStats: superAdminProcedure.query(async ({ ctx }) => {
		const totalOrgs = await ctx.db.query.organizations.findMany({
			columns: { id: true, name: true, logoUrl: true },
		});
		const orgsWithCustomLogos = totalOrgs.filter((o) => Boolean(o.logoUrl)).length;

		return {
			bucket: env.S3_BUCKET_NAME,
			region: env.S3_REGION,
			endpoint: env.S3_ENDPOINT_URL,
			publicUrl: env.S3_PUBLIC_URL || `${env.S3_ENDPOINT_URL}/${env.S3_BUCKET_NAME}`,
			pathStyleAddressing: true,
			totalTenants: totalOrgs.length,
			tenantsWithUploadedAssets: orgsWithCustomLogos,
			status: "HEALTHY",
		};
	}),

	// --- SYSTEM AUDIT TRAIL PROCEDURES ---
	getAuditLogs: superAdminProcedure
		.input(
			z
				.object({
					action: z.string().optional(),
					actorEmail: z.string().optional(),
					targetId: z.string().optional(),
					limit: z.number().min(1).max(100).default(50),
					offset: z.number().min(0).default(0),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const conditions = [];
			if (input?.action && input.action !== "ALL") {
				conditions.push(eq(systemAuditLogs.action, input.action));
			}
			if (input?.actorEmail && input.actorEmail.trim() !== "") {
				conditions.push(
					ilike(systemAuditLogs.actorEmail, `%${input.actorEmail.trim()}%`),
				);
			}
			if (input?.targetId && input.targetId.trim() !== "") {
				conditions.push(eq(systemAuditLogs.targetId, input.targetId.trim()));
			}

			const query = ctx.db
				.select()
				.from(systemAuditLogs);

			if (conditions.length > 0) {
				return query
					.where(and(...conditions))
					.orderBy(desc(systemAuditLogs.createdAt))
					.limit(input?.limit || 50)
					.offset(input?.offset || 0);
			}

			return query
				.orderBy(desc(systemAuditLogs.createdAt))
				.limit(input?.limit || 50)
				.offset(input?.offset || 0);
		}),

	getAuditActions: superAdminProcedure.query(async ({ ctx }) => {
		const distinctActions = await ctx.db
			.selectDistinct({ action: systemAuditLogs.action })
			.from(systemAuditLogs);
		return distinctActions.map((d: any) => d.action).filter(Boolean);
	}),

	// --- TENANT DEEP INSPECTOR PROCEDURES ---
	getTenantDeepInspection: superAdminProcedure
		.input(z.object({ orgId: z.string() }))
		.query(async ({ ctx, input }) => {
			const org = await ctx.db.query.organizations.findFirst({
				where: eq(organizations.id, input.orgId),
			});

			if (!org) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tenant organization not found",
				});
			}

			// Members with user profile
			const members = await ctx.db.query.organizationMembers.findMany({
				where: eq(organizationMembers.organizationId, input.orgId),
				with: {
					user: {
						columns: {
							id: true,
							name: true,
							email: true,
							image: true,
							systemRole: true,
							createdAt: true,
						},
					},
				},
			});

			// Financials & Commercial Metrics
			const tenantDeals = await ctx.db
				.select()
				.from(deals)
				.where(eq(deals.organizationId, input.orgId));

			const wonDeals = tenantDeals.filter((d) => d.status === "WON");
			const openDeals = tenantDeals.filter((d) => d.status === "OPEN");
			const totalWonRevenue = wonDeals.reduce(
				(sum, d) => sum + (d.value || 0),
				0,
			);
			const openPipelineValue = openDeals.reduce(
				(sum, d) => sum + (d.value || 0),
				0,
			);

			const tenantInvoices = await ctx.db
				.select()
				.from(invoices)
				.where(eq(invoices.organizationId, input.orgId));

			const totalInvoiced = tenantInvoices.reduce(
				(sum, i) => sum + (i.totalAmount || 0),
				0,
			);
			const totalPaid = tenantInvoices.reduce(
				(sum, i) => sum + (i.amountPaid || 0),
				0,
			);
			const paidInvoicesCount = tenantInvoices.filter(
				(i) => i.status === "PAID",
			).length;
			const overdueInvoicesCount = tenantInvoices.filter(
				(i) => i.status === "OVERDUE",
			).length;

			// Entitlements & Overrides
			const entitlements = await getTenantEntitlements(ctx.db, input.orgId);
			const overridesRecord = await ctx.db.query.tenantOverrides.findFirst({
				where: eq(tenantOverrides.organizationId, input.orgId),
			});

			let parsedOverrides = { features: {}, quotas: {} };
			if (overridesRecord) {
				try {
					if (overridesRecord.featureOverrides) {
						parsedOverrides.features = JSON.parse(
							overridesRecord.featureOverrides,
						);
					}
					if (overridesRecord.quotaOverrides) {
						parsedOverrides.quotas = JSON.parse(
							overridesRecord.quotaOverrides,
						);
					}
				} catch {}
			}

			// Recent Audit Logs targeting this tenant
			const recentAuditLogs = await ctx.db
				.select()
				.from(systemAuditLogs)
				.where(eq(systemAuditLogs.targetId, input.orgId))
				.orderBy(desc(systemAuditLogs.createdAt))
				.limit(15);

			return {
				organization: org,
				members: members.map((m) => ({
					id: m.id,
					userId: m.userId,
					role: m.role,
					joinedAt: m.joinedAt,
					user: m.user,
				})),
				metrics: {
					deals: {
						total: tenantDeals.length,
						wonCount: wonDeals.length,
						openCount: openDeals.length,
						wonRevenueCents: totalWonRevenue,
						openPipelineCents: openPipelineValue,
					},
					invoices: {
						total: tenantInvoices.length,
						paidCount: paidInvoicesCount,
						overdueCount: overdueInvoicesCount,
						totalInvoicedCents: totalInvoiced,
						totalPaidCents: totalPaid,
					},
					totalMembers: members.length,
				},
				entitlements,
				overrides: parsedOverrides,
				recentAuditLogs,
			};
		}),

	toggleTenantStatus: superAdminProcedure
		.input(
			z.object({
				orgId: z.string(),
				isActive: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(organizations)
				.set({ isActive: input.isActive })
				.where(eq(organizations.id, input.orgId))
				.returning();

			await logSuperAdminAction(ctx.db, {
				actorId: ctx.session.user.id,
				actorEmail: ctx.session.user.email || "superadmin@devcrm.io",
				action: input.isActive ? "ACTIVATE_TENANT" : "SUSPEND_TENANT",
				targetType: "ORGANIZATION",
				targetId: input.orgId,
				metadata: { organizationName: updated?.name, isActive: input.isActive },
			});

			return updated;
		}),
});
