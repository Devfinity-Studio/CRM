import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "~/server/db/schema";
import {
	organizations,
	subscriptionPlans,
	subscriptions,
	tenantOverrides,
} from "~/server/db/schema";

export type FeatureKey =
	| "hasInventory"
	| "hasSubscriptions"
	| "hasAutomations"
	| "hasCustomDomains"
	| "hasWebhooks"
	| "hasApiKeys";

export type QuotaKey =
	| "maxUsers"
	| "maxContacts"
	| "maxInvoicesPerMonth"
	| "maxAutomationsPerMonth"
	| "maxStorageMb";

export type ActionType = "read" | "create" | "update" | "delete" | "export";

export interface PermissionMatrix {
	[moduleName: string]: {
		read?: boolean;
		create?: boolean;
		update?: boolean;
		delete?: boolean;
		export?: boolean;
	};
}

export interface TenantEntitlements {
	features: Record<FeatureKey, boolean>;
	quotas: Record<QuotaKey, number>;
	planName: string;
	planCode: string;
}

const DEFAULT_STARTER_ENTITLEMENTS: TenantEntitlements = {
	features: {
		hasInventory: true,
		hasSubscriptions: false,
		hasAutomations: false,
		hasCustomDomains: false,
		hasWebhooks: false,
		hasApiKeys: true,
	},
	quotas: {
		maxUsers: 3,
		maxContacts: 500,
		maxInvoicesPerMonth: 50,
		maxAutomationsPerMonth: 100,
		maxStorageMb: 512,
	},
	planName: "Starter Tier",
	planCode: "starter",
};

export async function getTenantEntitlements(
	db: PostgresJsDatabase<typeof schema>,
	organizationId: string,
): Promise<TenantEntitlements> {
	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	});

	let baseEntitlements: TenantEntitlements = {
		...DEFAULT_STARTER_ENTITLEMENTS,
		features: { ...DEFAULT_STARTER_ENTITLEMENTS.features },
		quotas: { ...DEFAULT_STARTER_ENTITLEMENTS.quotas },
	};

	let planId = org?.planId;

	if (!planId) {
		const activeSub = await db.query.subscriptions.findFirst({
			where: and(
				eq(subscriptions.organizationId, organizationId),
				eq(subscriptions.status, "ACTIVE"),
			),
			with: { plan: true },
		});
		if (activeSub?.plan) {
			planId = activeSub.planId;
		}
	}

	if (planId) {
		const plan = await db.query.subscriptionPlans.findFirst({
			where: eq(subscriptionPlans.id, planId),
		});

		if (plan) {
			baseEntitlements = {
				features: {
					hasInventory: plan.hasInventory ?? true,
					hasSubscriptions: plan.hasSubscriptions ?? true,
					hasAutomations: plan.hasAutomations ?? true,
					hasCustomDomains: plan.hasCustomDomains ?? false,
					hasWebhooks: plan.hasWebhooks ?? false,
					hasApiKeys: plan.hasApiKeys ?? true,
				},
				quotas: {
					maxUsers: plan.maxUsers,
					maxContacts: plan.maxContacts,
					maxInvoicesPerMonth: plan.maxInvoicesPerMonth ?? 100,
					maxAutomationsPerMonth: plan.maxAutomationsPerMonth ?? 500,
					maxStorageMb: plan.maxStorageMb ?? 1024,
				},
				planName: plan.name,
				planCode: plan.code,
			};
		}
	}

	const overrides = await db.query.tenantOverrides.findFirst({
		where: eq(tenantOverrides.organizationId, organizationId),
	});

	if (overrides) {
		if (overrides.featureOverrides) {
			try {
				const featJson = JSON.parse(
					overrides.featureOverrides,
				) as Partial<Record<FeatureKey, boolean>>;
				baseEntitlements.features = {
					...baseEntitlements.features,
					...featJson,
				};
			} catch (e) {
				console.error("[Entitlements] Failed to parse featureOverrides:", e);
			}
		}

		if (overrides.quotaOverrides) {
			try {
				const quotaJson = JSON.parse(
					overrides.quotaOverrides,
				) as Partial<Record<QuotaKey, number>>;
				baseEntitlements.quotas = {
					...baseEntitlements.quotas,
					...quotaJson,
				};
			} catch (e) {
				console.error("[Entitlements] Failed to parse quotaOverrides:", e);
			}
		}
	}

	return baseEntitlements;
}

export async function checkFeatureAccess(
	db: PostgresJsDatabase<typeof schema>,
	organizationId: string,
	feature: FeatureKey,
): Promise<boolean> {
	const entitlements = await getTenantEntitlements(db, organizationId);
	return entitlements.features[feature] === true;
}

export async function checkQuotaUsage(
	db: PostgresJsDatabase<typeof schema>,
	organizationId: string,
	metric: QuotaKey,
	currentCount: number,
): Promise<{ allowed: boolean; limit: number; current: number }> {
	const entitlements = await getTenantEntitlements(db, organizationId);
	const limit = entitlements.quotas[metric] ?? 0;
	return {
		allowed: currentCount < limit,
		limit,
		current: currentCount,
	};
}

export function checkPermission(
	role: string,
	permissionsJson: string | null | undefined,
	module: string,
	action: ActionType,
): boolean {
	if (role === "OWNER" || role === "ADMIN" || role === "SUPER_ADMIN") {
		return true;
	}

	switch (role) {
		case "SALES_REP":
			if (["contacts", "clients", "deals", "quotes"].includes(module)) {
				return true;
			}
			if (["invoices", "inventory", "dashboard"].includes(module)) {
				return action === "read";
			}
			return false;

		case "ACCOUNTANT":
			if (["invoices", "payments", "subscriptions", "statements", "taxes"].includes(module)) {
				return true;
			}
			if (["clients", "deals", "dashboard"].includes(module)) {
				return action === "read";
			}
			return false;

		case "INVENTORY_MANAGER":
			if (["inventory", "products"].includes(module)) {
				return true;
			}
			if (["invoices", "deals", "dashboard"].includes(module)) {
				return action === "read";
			}
			return false;

		case "VIEWER":
			return action === "read";

		case "MEMBER":
			if (["settings", "automations", "apiKeys", "webhooks"].includes(module)) {
				return action === "read";
			}
			return true;

		case "CUSTOM_ROLE":
			if (!permissionsJson) return false;
			try {
				const matrix = JSON.parse(permissionsJson) as PermissionMatrix;
				const modulePerms = matrix[module];
				return modulePerms ? !!modulePerms[action] : false;
			} catch {
				return false;
			}

		default:
			return false;
	}
}

