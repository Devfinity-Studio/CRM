import { describe, expect, it } from "vitest";
import {
	checkPermission,
	checkQuotaUsage,
	getTenantEntitlements,
	checkFeatureAccess,
} from "../services/entitlements";

describe("Entitlements & RBAC Service", () => {
	describe("checkPermission", () => {
		it("should grant full access to OWNER, ADMIN, and SUPER_ADMIN", () => {
			expect(checkPermission("OWNER", null, "billing", "delete")).toBe(true);
			expect(checkPermission("ADMIN", null, "automations", "create")).toBe(true);
			expect(checkPermission("SUPER_ADMIN", null, "settings", "update")).toBe(true);
		});

		it("should enforce SALES_REP permissions (CRUD on CRM/deals, read-only on inventory/invoices)", () => {
			expect(checkPermission("SALES_REP", null, "contacts", "create")).toBe(true);
			expect(checkPermission("SALES_REP", null, "deals", "update")).toBe(true);
			expect(checkPermission("SALES_REP", null, "quotes", "delete")).toBe(true);
			expect(checkPermission("SALES_REP", null, "invoices", "read")).toBe(true);
			expect(checkPermission("SALES_REP", null, "invoices", "create")).toBe(false);
			expect(checkPermission("SALES_REP", null, "automations", "read")).toBe(false);
		});

		it("should enforce ACCOUNTANT permissions (CRUD on billing/invoices, read-only on clients)", () => {
			expect(checkPermission("ACCOUNTANT", null, "invoices", "create")).toBe(true);
			expect(checkPermission("ACCOUNTANT", null, "payments", "update")).toBe(true);
			expect(checkPermission("ACCOUNTANT", null, "subscriptions", "delete")).toBe(true);
			expect(checkPermission("ACCOUNTANT", null, "clients", "read")).toBe(true);
			expect(checkPermission("ACCOUNTANT", null, "clients", "create")).toBe(false);
			expect(checkPermission("ACCOUNTANT", null, "automations", "read")).toBe(false);
		});

		it("should enforce INVENTORY_MANAGER permissions (CRUD on inventory, read-only on invoices)", () => {
			expect(checkPermission("INVENTORY_MANAGER", null, "inventory", "create")).toBe(true);
			expect(checkPermission("INVENTORY_MANAGER", null, "products", "update")).toBe(true);
			expect(checkPermission("INVENTORY_MANAGER", null, "invoices", "read")).toBe(true);
			expect(checkPermission("INVENTORY_MANAGER", null, "invoices", "create")).toBe(false);
		});

		it("should enforce VIEWER permissions (read-only everywhere)", () => {
			expect(checkPermission("VIEWER", null, "deals", "read")).toBe(true);
			expect(checkPermission("VIEWER", null, "deals", "update")).toBe(false);
			expect(checkPermission("VIEWER", null, "invoices", "create")).toBe(false);
		});

		it("should evaluate CUSTOM_ROLE JSON permission matrix accurately", () => {
			const customMatrix = JSON.stringify({
				deals: { read: true, create: true, update: false, delete: false },
				inventory: { read: true, create: true, update: true, delete: false },
			});

			expect(checkPermission("CUSTOM_ROLE", customMatrix, "deals", "read")).toBe(true);
			expect(checkPermission("CUSTOM_ROLE", customMatrix, "deals", "create")).toBe(true);
			expect(checkPermission("CUSTOM_ROLE", customMatrix, "deals", "update")).toBe(false);
			expect(checkPermission("CUSTOM_ROLE", customMatrix, "inventory", "update")).toBe(true);
			expect(checkPermission("CUSTOM_ROLE", customMatrix, "billing", "read")).toBe(false);
		});
	});

	describe("Tenant Entitlements & Overrides Resolution", () => {
		it("should resolve default starter tier when no plan is attached", async () => {
			// Mock database query returning no plan and no overrides
			const mockDb: any = {
				query: {
					organizations: {
						findFirst: () => Promise.resolve({ id: "org-1", planId: null }),
					},
					subscriptions: {
						findFirst: () => Promise.resolve(null),
					},
					subscriptionPlans: {
						findFirst: () => Promise.resolve(null),
					},
					tenantOverrides: {
						findFirst: () => Promise.resolve(null),
					},
				},
			};

			const entitlements = await getTenantEntitlements(mockDb, "org-1");
			expect(entitlements.planCode).toBe("starter");
			expect(entitlements.features.hasInventory).toBe(true);
			expect(entitlements.features.hasSubscriptions).toBe(false);
			expect(entitlements.features.hasCustomDomains).toBe(false);
			expect(entitlements.quotas.maxUsers).toBe(3);
			expect(entitlements.quotas.maxContacts).toBe(500);
		});

		it("should resolve plan features and quotas when plan is attached", async () => {
			const mockDb: any = {
				query: {
					organizations: {
						findFirst: () => Promise.resolve({ id: "org-2", planId: "plan-pro" }),
					},
					subscriptions: {
						findFirst: () => Promise.resolve(null),
					},
					subscriptionPlans: {
						findFirst: () =>
							Promise.resolve({
								id: "plan-pro",
								name: "Enterprise Tier",
								code: "enterprise",
								maxUsers: 50,
								maxContacts: 50000,
								maxInvoicesPerMonth: 2000,
								maxAutomationsPerMonth: 10000,
								maxStorageMb: 25000,
								hasInventory: true,
								hasSubscriptions: true,
								hasAutomations: true,
								hasCustomDomains: true,
								hasWebhooks: true,
								hasApiKeys: true,
							}),
					},
					tenantOverrides: {
						findFirst: () => Promise.resolve(null),
					},
				},
			};

			const entitlements = await getTenantEntitlements(mockDb, "org-2");
			expect(entitlements.planCode).toBe("enterprise");
			expect(entitlements.features.hasCustomDomains).toBe(true);
			expect(entitlements.features.hasWebhooks).toBe(true);
			expect(entitlements.quotas.maxContacts).toBe(50000);
		});

		it("should allow tenant overrides to take precedence over plan defaults", async () => {
			const mockDb: any = {
				query: {
					organizations: {
						findFirst: () => Promise.resolve({ id: "org-3", planId: null }),
					},
					subscriptions: {
						findFirst: () => Promise.resolve(null),
					},
					subscriptionPlans: {
						findFirst: () => Promise.resolve(null),
					},
					tenantOverrides: {
						findFirst: () =>
							Promise.resolve({
								organizationId: "org-3",
								featureOverrides: JSON.stringify({ hasCustomDomains: true, hasWebhooks: true }),
								quotaOverrides: JSON.stringify({ maxContacts: 99999 }),
							}),
					},
				},
			};

			const entitlements = await getTenantEntitlements(mockDb, "org-3");
			expect(entitlements.features.hasCustomDomains).toBe(true);
			expect(entitlements.features.hasWebhooks).toBe(true);
			expect(entitlements.quotas.maxContacts).toBe(99999);
		});

		it("should check quota usage accurately", async () => {
			const mockDb: any = {
				query: {
					organizations: {
						findFirst: () => Promise.resolve({ id: "org-4", planId: null }),
					},
					subscriptions: {
						findFirst: () => Promise.resolve(null),
					},
					subscriptionPlans: {
						findFirst: () => Promise.resolve(null),
					},
					tenantOverrides: {
						findFirst: () => Promise.resolve(null),
					},
				},
			};

			// Default starter has maxUsers = 3
			const quotaUnder = await checkQuotaUsage(mockDb, "org-4", "maxUsers", 2);
			expect(quotaUnder.allowed).toBe(true);

			const quotaAtLimit = await checkQuotaUsage(mockDb, "org-4", "maxUsers", 3);
			expect(quotaAtLimit.allowed).toBe(false);
		});
	});
});
