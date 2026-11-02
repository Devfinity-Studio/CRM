import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth before importing appRouter
vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
	handlers: {},
	signIn: vi.fn(),
	signOut: vi.fn(),
}));

// Mock DB
vi.mock("~/server/db", () => ({
	db: {
		select: vi.fn(),
		update: vi.fn(),
		insert: vi.fn(),
		delete: vi.fn(),
		query: {
			organizations: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
			subscriptionPlans: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
			tenantOverrides: {
				findFirst: vi.fn(),
			},
			subscriptions: {
				findFirst: vi.fn(),
			},
			users: {
				findMany: vi.fn(),
			},
			globalSettings: {
				findFirst: vi.fn(),
			},
		},
	},
}));

import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

describe("SuperAdmin Plans & Overrides Router", () => {
	const mockSuperAdmin = {
		id: "super-1",
		email: "admin@devcrm.io",
		name: "Platform Admin",
		systemRole: "SUPER_ADMIN" as const,
		organizationId: "org-hq",
	};

	const createCaller = appRouter.createCaller;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should retrieve all subscription plans", async () => {
		const mockPlans = [
			{ id: "p1", name: "Starter", priceMonthly: 2900, code: "starter" },
			{ id: "p2", name: "Pro", priceMonthly: 9900, code: "pro" },
		];

		// biome-ignore lint/suspicious/noExplicitAny: test mock
		(db.query.subscriptionPlans.findMany as any).mockResolvedValue(mockPlans);

		const caller = createCaller({
			session: {
				user: mockSuperAdmin,
				expires: new Date(Date.now() + 86400000).toISOString(),
			},
			db,
			headers: new Headers(),
		});

		const plans = await caller.superadmin.getPlans();
		expect(plans).toHaveLength(2);
		expect(plans[0]?.code).toBe("starter");
	});

	it("should create a new subscription plan with feature flags and quotas", async () => {
		const newPlan = {
			id: "plan-new",
			name: "Growth Tier",
			code: "growth",
			priceMonthly: 4900,
			priceYearly: 49000,
			maxUsers: 15,
			maxContacts: 5000,
			maxInvoicesPerMonth: 250,
			maxAutomationsPerMonth: 1000,
			maxStorageMb: 5000,
			hasInventory: true,
			hasSubscriptions: true,
			hasAutomations: true,
			hasCustomDomains: true,
			hasWebhooks: false,
			hasApiKeys: true,
		};

		// biome-ignore lint/suspicious/noExplicitAny: test mock
		(db.insert as any).mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([newPlan]),
			}),
		});

		const caller = createCaller({
			session: {
				user: mockSuperAdmin,
				expires: new Date(Date.now() + 86400000).toISOString(),
			},
			db,
			headers: new Headers(),
		});

		const plan = await caller.superadmin.createPlan({
			name: "Growth Tier",
			code: "growth",
			priceMonthly: 49,
			priceYearly: 490,
			maxUsers: 15,
			maxContacts: 5000,
			maxInvoicesPerMonth: 250,
			maxAutomationsPerMonth: 1000,
			maxStorageMb: 5000,
			hasInventory: true,
			hasSubscriptions: true,
			hasAutomations: true,
			hasCustomDomains: true,
			hasWebhooks: false,
			hasApiKeys: true,
		});

		expect(plan.id).toBe("plan-new");
		expect(plan.maxContacts).toBe(5000);
	});

	it("should assign a plan to a tenant organization", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: test mock
		(db.update as any).mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ id: "org-1" }]),
			}),
		});

		const caller = createCaller({
			session: {
				user: mockSuperAdmin,
				expires: new Date(Date.now() + 86400000).toISOString(),
			},
			db,
			headers: new Headers(),
		});

		const result = await caller.superadmin.assignTenantPlan({
			organizationId: "org-1",
			planId: "plan-pro",
		});

		expect(result).toEqual({ success: true });
	});
});

