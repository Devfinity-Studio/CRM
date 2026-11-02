import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth before importing appRouter
vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
	handlers: {},
	signIn: vi.fn(),
	signOut: vi.fn(),
}));

// Mock webhooks dispatch
vi.mock("~/server/webhooks/dispatch", () => ({
	dispatchWebhook: vi.fn().mockResolvedValue(undefined),
}));

// Mock DB
vi.mock("~/server/db", () => ({
	db: {
		select: vi.fn(),
		update: vi.fn(),
		insert: vi.fn(),
		delete: vi.fn(),
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
			invoices: {
				findFirst: vi.fn(),
			},
			quotes: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
			userSettings: {
				findFirst: vi.fn(),
			},
			products: {
				findFirst: vi.fn(),
			},
		},
	},
}));

import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

describe("Billing Router", () => {
	const mockUser = {
		id: "user-billing-1",
		email: "billing-tester@devcrm.io",
		name: "Billing Tester",
		systemRole: "USER" as const,
		organizationId: "org-billing-200",
	};

	const createCaller = appRouter.createCaller;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should get products scoped to organization", async () => {
		vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue({
			organizationId: "org-billing-200",
			userId: "user-billing-1",
			role: "OWNER",
		} as any);

		const mockProducts = [
			{
				id: "prod-1",
				organizationId: "org-billing-200",
				name: "Cloud Hosting Standard",
				unitPrice: 5000,
				type: "SERVICE",
			},
			{
				id: "prod-2",
				organizationId: "org-billing-200",
				name: "Custom Development Hour",
				unitPrice: 12000,
				type: "SERVICE",
			},
		];

		const mockFrom = vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				orderBy: vi.fn().mockResolvedValue(mockProducts),
			}),
		});

		vi.mocked(db.select).mockReturnValue({
			from: mockFrom,
		} as any);

		const caller = createCaller({
			session: {
				user: mockUser,
				expires: "2099-01-01",
			},
			db: db as any,
		});

		const result = await caller.billing.getProducts();

		expect(result).toHaveLength(2);
		expect(result[0]?.name).toBe("Cloud Hosting Standard");
		expect(result[1]?.unitPrice).toBe(12000);
	});

	it("should create a new product", async () => {
		vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue({
			organizationId: "org-billing-200",
			userId: "user-billing-1",
			role: "OWNER",
		} as any);

		const newProduct = {
			id: "prod-new-1",
			organizationId: "org-billing-200",
			name: "Enterprise SLA",
			unitPrice: 25000,
			type: "SERVICE" as const,
			stockQuantity: 0,
		};

		vi.mocked(db.insert).mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([newProduct]),
			}),
		} as any);

		const caller = createCaller({
			session: {
				user: mockUser,
				expires: "2099-01-01",
			},
			db: db as any,
		});

		const result = await caller.billing.createProduct({
			name: "Enterprise SLA",
			unitPrice: 25000,
			type: "SERVICE",
		});

		expect(result).toBeDefined();
		expect(result.id).toBe("prod-new-1");
		expect(result.name).toBe("Enterprise SLA");
	});

	it("should retrieve quotes for the organization", async () => {
		vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue({
			organizationId: "org-billing-200",
			userId: "user-billing-1",
			role: "OWNER",
		} as any);

		const mockQuotes = [
			{
				id: "quote-1",
				organizationId: "org-billing-200",
				quoteNumber: "Q-2026-001",
				total: 75000,
				status: "SENT",
			},
		];

		vi.mocked(db.query.quotes.findMany).mockResolvedValue(mockQuotes as any);

		const caller = createCaller({
			session: {
				user: mockUser,
				expires: "2099-01-01",
			},
			db: db as any,
		});

		const result = await caller.billing.getQuotes();

		expect(result).toHaveLength(1);
		expect(result[0]?.quoteNumber).toBe("Q-2026-001");
	});

	it("should delete an invoice scoped to organization", async () => {
		vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue({
			organizationId: "org-billing-200",
			userId: "user-billing-1",
			role: "OWNER",
		} as any);

		vi.mocked(db.delete).mockReturnValue({
			where: vi.fn().mockResolvedValue({ rowCount: 1 }),
		} as any);

		const caller = createCaller({
			session: {
				user: mockUser,
				expires: "2099-01-01",
			},
			db: db as any,
		});

		const result = await caller.billing.deleteInvoice({
			id: "inv-to-delete",
		});

		expect(result).toEqual({ success: true });
	});
});
