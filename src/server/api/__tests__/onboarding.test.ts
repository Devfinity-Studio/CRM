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
			users: {
				findFirst: vi.fn(),
			},
			organizationMembers: {
				findFirst: vi.fn(),
			},
			products: {
				findMany: vi.fn(),
			},
			crmLeads: {
				findMany: vi.fn(),
			},
		},
	},
}));

import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

describe("Onboarding Router", () => {
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

	it("should get status with onboardingComplete and hasSeenWelcome flags", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: test mock
		(db.query.users.findFirst as any).mockResolvedValue({
			id: "user-123",
			onboardingComplete: false,
			hasSeenWelcome: false,
		});

		const caller = createCaller({
			session: {
				user: mockUser,
				expires: new Date(Date.now() + 86400000).toISOString(),
			},
			db,
			headers: new Headers(),
		});

		const status = await caller.onboarding.getStatus();
		expect(status).toEqual({
			onboardingComplete: false,
			hasSeenWelcome: false,
		});
	});

	it("should mark welcome as seen", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: test mock
		(db.update as any).mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ id: "user-123" }]),
			}),
		});

		const caller = createCaller({
			session: {
				user: mockUser,
				expires: new Date(Date.now() + 86400000).toISOString(),
			},
			db,
			headers: new Headers(),
		});

		const result = await caller.onboarding.markWelcomeSeen();
		expect(result).toEqual({ success: true });
	});
});

