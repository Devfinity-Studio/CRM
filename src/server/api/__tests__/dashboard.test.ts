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
		query: {
			organizationMembers: {
				findFirst: vi.fn(),
			},
			organizations: {
				findFirst: vi.fn(),
			},
			users: {
				findFirst: vi.fn(),
			},
			crmTasks: {
				findMany: vi.fn(),
			},
		},
	},
}));

import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

describe("Dashboard Router", () => {
	const mockUser = {
		id: "user-123",
		email: "test@devcrm.io",
		name: "Alex Vance",
		systemRole: "USER" as const,
		organizationId: "org-1",
	};

	const createCaller = appRouter.createCaller;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should fetch layout data with user memberships and active organization", async () => {
		const mockMemberships = [
			{
				organizationId: "org-1",
				role: "OWNER",
				name: "Acme Corp",
				logoUrl: "https://example.com/logo.png",
				slug: "acme",
			},
		];

		// biome-ignore lint/suspicious/noExplicitAny: test mock
		(db.select as any).mockReturnValue({
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(mockMemberships),
				}),
			}),
		});

		// biome-ignore lint/suspicious/noExplicitAny: test mock
		(db.query.users.findFirst as any).mockResolvedValue({
			id: "user-123",
			name: "Alex Vance",
			email: "test@devcrm.io",
			image: null,
			onboardingComplete: true,
		});

		const caller = createCaller({
			// biome-ignore lint/suspicious/noExplicitAny: test mock
			db: db as any,
			session: {
				user: mockUser,
				expires: "2099",
			},
			headers: new Headers(),
		});

		const result = await caller.dashboard.getLayoutData();

		expect(result.user.name).toBe("Alex Vance");
		expect(result.activeOrganization.name).toBe("Acme Corp");
		expect(result.organizations).toHaveLength(1);
		expect(result.organizations[0]?.id).toBe("org-1");
	});

	it("should calculate metrics with period filter", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: test mock
		(db.query.organizationMembers.findFirst as any).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
		});

		// Mock sequential db.select queries for:
		// 1) currentRevenue
		// 2) priorRevenue
		// 3) deals
		// 4) overdue
		// 5) contacts
		let callCount = 0;
		// biome-ignore lint/suspicious/noExplicitAny: test mock
		(db.select as any).mockImplementation(() => ({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockImplementation(() => {
					callCount++;
					if (callCount === 1) return Promise.resolve([{ total: 120000 }]); // current revenue
					if (callCount === 2) return Promise.resolve([{ total: 100000 }]); // prior revenue
					if (callCount === 3)
						return Promise.resolve([{ count: 4, value: 340000 }]); // deals
					if (callCount === 4)
						return Promise.resolve([{ count: 1, amount: 15000 }]); // overdue
					return Promise.resolve([{ count: 25 }]); // contacts
				}),
			}),
		}));

		const caller = createCaller({
			// biome-ignore lint/suspicious/noExplicitAny: test mock
			db: db as any,
			session: {
				user: mockUser,
				expires: "2099",
			},
			headers: new Headers(),
		});

		const metrics = await caller.dashboard.getMetrics({ period: "month" });

		expect(metrics.totalRevenue).toBe(120000);
		expect(metrics.revenueTrend).toBe(20); // (120000 - 100000) / 100000 = +20.0%
		expect(metrics.activeDealsCount).toBe(4);
		expect(metrics.pipelineValue).toBe(340000);
		expect(metrics.overdueInvoicesCount).toBe(1);
		expect(metrics.period).toBe("month");
	});
});
