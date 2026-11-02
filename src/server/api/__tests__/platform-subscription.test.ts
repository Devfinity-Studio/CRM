import { describe, expect, it, vi } from "vitest";

// Mock auth before importing router
vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
	handlers: {},
	signIn: vi.fn(),
	signOut: vi.fn(),
}));

vi.mock("~/server/webhooks/dispatch", () => ({
	dispatchWebhook: vi.fn().mockResolvedValue(undefined),
}));

import { billingRouter } from "~/server/api/routers/billing";

describe("Platform SaaS Subscription & Quotas Router", () => {
	it("should retrieve organization platform subscription and live quota metrics", async () => {
		const caller = billingRouter.createCaller({
			session: {
				user: {
					id: "usr-1",
					email: "admin@acme.com",
					name: "Admin User",
				},
				expires: "2099-01-01",
			},
			db: {
				query: {
					organizationMembers: {
						findFirst: vi.fn().mockResolvedValue({
							id: "mem-1",
							userId: "usr-1",
							organizationId: "org-1",
						}),
					},
					organizations: {
						findFirst: vi.fn().mockResolvedValue({
							id: "org-1",
							name: "Acme Corp",
							slug: "acme",
							plan: "PRO",
							planId: "plan-pro",
							status: "ACTIVE",
							maxContacts: 5000,
							maxInvoices: 1000,
							maxTeamSeats: 10,
							maxAutomationsMonthly: 20000,
							dodoCustomerId: "cus_dodo_123",
						}),
					},
					subscriptionPlans: {
						findFirst: vi.fn().mockResolvedValue({
							id: "plan-pro",
							name: "Pro Plan",
							slug: "pro",
							priceMonthly: 7900,
							priceYearly: 79000,
							featureFlags: { customDomains: true, advancedTax: true },
						}),
					},
					subscriptions: {
						findFirst: vi.fn().mockResolvedValue({
							id: "sub-1",
							status: "ACTIVE",
							billingCycle: "monthly",
							currentPeriodEnd: new Date("2026-12-01"),
							dodoSubscriptionId: "sub_dodo_456",
						}),
					},
				},
				select: vi.fn(() => ({
					from: vi.fn(() => ({
						where: vi.fn().mockResolvedValue([{ val: 42 }]),
					})),
				})),
			} as any,
		});

		const res = await caller.getPlatformSubscription();

		expect(res.organization.name).toBe("Acme Corp");
		expect(res.organization.plan).toBe("PRO");
		expect(res.organization.status).toBe("ACTIVE");
		expect(res.plan?.name).toBe("Pro Plan");
		expect(res.subscription?.status).toBe("ACTIVE");
		expect(res.usage.contacts.used).toBe(42);
		expect(res.usage.contacts.max).toBe(5000);
	});

	it("should create platform checkout session with plan and returnUrl", async () => {
		const caller = billingRouter.createCaller({
			session: {
				user: {
					id: "usr-1",
					email: "admin@acme.com",
					name: "Admin User",
				},
				expires: "2099-01-01",
			},
			db: {
				query: {
					organizationMembers: {
						findFirst: vi.fn().mockResolvedValue({
							organizationId: "org-1",
						}),
					},
					subscriptionPlans: {
						findFirst: vi.fn().mockResolvedValue({
							id: "plan-enterprise",
							name: "Enterprise",
							priceMonthly: 19900,
							priceYearly: 199000,
						}),
					},
				},
			} as any,
		});

		const res = await caller.createPlatformCheckoutSession({
			planId: "plan-enterprise",
			billingCycle: "yearly",
			returnUrl: "https://crm.devfinity.net/settings/billing",
		});

		expect(res.sessionId).toBeDefined();
		expect(res.checkoutUrl).toContain("session_id=");
		expect(res.checkoutUrl).toContain("plan_id=plan-enterprise");
	});

	it("should generate customer portal session url", async () => {
		const caller = billingRouter.createCaller({
			session: {
				user: {
					id: "usr-1",
					email: "admin@acme.com",
					name: "Admin User",
				},
				expires: "2099-01-01",
			},
			db: {
				query: {
					organizationMembers: {
						findFirst: vi.fn().mockResolvedValue({
							organizationId: "org-1",
						}),
					},
					organizations: {
						findFirst: vi.fn().mockResolvedValue({
							id: "org-1",
							dodoCustomerId: "cus_test_123",
						}),
					},
				},
			} as any,
		});

		const res = await caller.createCustomerPortalSession({
			returnUrl: "https://crm.devfinity.net/settings/billing",
		});

		expect(res.portalUrl).toBeDefined();
	});
});
