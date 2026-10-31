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
		},
	},
}));

import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

describe("Deals Router", () => {
	const mockUser = {
		id: "user-123",
		email: "alex@devcrm.io",
		name: "Alex Vance",
		systemRole: "USER" as const,
		organizationId: "org-1",
	};

	const createCaller = appRouter.createCaller;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should get deals with joined company, contact, and user info", async () => {
		const mockDealsJoined = [
			{
				deal: {
					id: "deal-1",
					organizationId: "org-1",
					pipelineId: "pipe-1",
					stageId: "stage-1",
					title: "Acme Cloud Migration",
					value: 2500000, // $25,000.00
					status: "OPEN",
					orderIndex: 0,
					expectedCloseDate: new Date("2026-11-15"),
				},
				contact: {
					firstName: "John",
					lastName: "Doe",
					leadScore: 85,
					qualificationStatus: "SQL",
				},
				company: {
					id: "comp-1",
					name: "Acme Corp",
					logoUrl: "https://example.com/acme.png",
				},
				assignedUser: {
					id: "user-123",
					name: "Alex Vance",
					image: "https://example.com/avatar.png",
				},
			},
		];

		// biome-ignore lint/suspicious/noExplicitAny: test mock
		(db.select as any).mockReturnValue({
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								orderBy: vi.fn().mockResolvedValue(mockDealsJoined),
							}),
						}),
					}),
				}),
			}),
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

		const result = await caller.deals.getDeals({
			organizationId: "org-1",
			pipelineId: "pipe-1",
		});

		expect(result).toHaveLength(1);
		expect(result[0]?.title).toBe("Acme Cloud Migration");
		expect(result[0]?.companyName).toBe("Acme Corp");
		expect(result[0]?.contactName).toBe("John Doe");
		expect(result[0]?.leadScore).toBe(85);
		expect(result[0]?.qualificationStatus).toBe("SQL");
		expect(result[0]?.assignedUserName).toBe("Alex Vance");
	});

	it("should calculate metrics summary correctly", async () => {
		const mockAllDeals = [
			{
				id: "d1",
				organizationId: "org-1",
				pipelineId: "pipe-1",
				stageId: "stage-1",
				value: 1000000, // $10,000
				status: "OPEN",
			},
			{
				id: "d2",
				organizationId: "org-1",
				pipelineId: "pipe-1",
				stageId: "stage-2",
				value: 2000000, // $20,000
				status: "OPEN",
			},
			{
				id: "d3",
				organizationId: "org-1",
				pipelineId: "pipe-1",
				stageId: "stage-3",
				value: 1500000,
				status: "WON",
			},
		];

		const mockStages = [
			{ id: "stage-1", winProbability: 20 },
			{ id: "stage-2", winProbability: 50 },
			{ id: "stage-3", winProbability: 100 },
		];

		let callCount = 0;
		// biome-ignore lint/suspicious/noExplicitAny: test mock
		(db.select as any).mockImplementation(() => ({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockImplementation(() => {
					callCount++;
					if (callCount === 1) return Promise.resolve(mockAllDeals);
					return Promise.resolve(mockStages);
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

		const metrics = await caller.deals.getMetricsSummary({
			organizationId: "org-1",
			pipelineId: "pipe-1",
		});

		expect(metrics.totalDeals).toBe(3);
		expect(metrics.openDealsCount).toBe(2);
		expect(metrics.wonDealsCount).toBe(1);
		expect(metrics.totalPipelineValue).toBe(3000000); // 10k + 20k
		// Forecast: 10,000 * 0.20 (2k) + 20,000 * 0.50 (10k) = 12,000 (1200000 cents)
		expect(metrics.forecastedRevenue).toBe(1200000);
		expect(metrics.winRate).toBe(100); // 1 won / 1 closed = 100%
	});

	it("should update deal stage and order index", async () => {
		const updated = {
			id: "deal-1",
			stageId: "stage-2",
			orderIndex: 3,
			status: "OPEN",
		};

		// biome-ignore lint/suspicious/noExplicitAny: test mock
		(db.update as any).mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([updated]),
				}),
			}),
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

		const result = await caller.deals.updateDealStage({
			dealId: "deal-1",
			targetStageId: "stage-2",
			newOrderIndex: 3,
		});

		expect(result).toEqual(updated);
	});

	it("should get deals by companyId with stage and pipeline metadata", async () => {
		const mockCompanyDeals = [
			{
				deal: {
					id: "deal-101",
					companyId: "comp-1",
					title: "Enterprise License Expansion",
					value: 4500000,
					status: "OPEN",
					createdAt: new Date("2026-10-15"),
				},
				stage: {
					id: "stage-2",
					name: "Proposal",
					color: "#10b981",
				},
				pipeline: {
					id: "pipe-1",
					name: "Standard Sales",
				},
			},
		];

		// biome-ignore lint/suspicious/noExplicitAny: test mock
		(db.select as any).mockReturnValue({
			from: vi.fn().mockReturnValue({
				leftJoin: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockResolvedValue(mockCompanyDeals),
						}),
					}),
				}),
			}),
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

		const deals = await caller.deals.getDealsByCompanyId({
			companyId: "comp-1",
		});

		expect(deals).toHaveLength(1);
		expect(deals[0]?.title).toBe("Enterprise License Expansion");
		expect(deals[0]?.stageName).toBe("Proposal");
		expect(deals[0]?.stageColor).toBe("#10b981");
		expect(deals[0]?.pipelineName).toBe("Standard Sales");
	});
});
