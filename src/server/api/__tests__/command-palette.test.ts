import { describe, expect, it, vi } from "vitest";

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
			clientSubscriptions: {
				findMany: vi.fn().mockResolvedValue([]),
			},
		},
	},
}));

import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

describe("Global Search & Command Palette Router", () => {
	const mockUser = {
		id: "user-123",
		email: "alex@devcrm.io",
		name: "Alex Vance",
		systemRole: "USER" as const,
		organizationId: "org-1",
	};

	const createCaller = appRouter.createCaller;

	it("should return categorized results across deals, companies, contacts, invoices, quotes, products", async () => {
		const mockDeals = [
			{ id: "d-1", title: "Enterprise Cloud Migration", value: 500000, status: "WON" },
		];
		const mockCompanies = [{ id: "c-1", name: "Enterprise Corp" }];
		const mockContacts = [{ id: "ct-1", firstName: "Jane", lastName: "Doe", email: "jane@enterprise.com" }];
		const mockInvoices = [{ id: "inv-1", invoiceNumber: "INV-ENT-001", totalAmount: 500000, status: "PAID" }];
		const mockQuotes = [{ id: "q-1", quoteNumber: "Q-ENT-001", totalAmount: 500000, status: "ACCEPTED" }];
		const mockProducts = [{ id: "p-1", name: "Enterprise Appliance", sku: "ENT-APP-1", stockQuantity: 25 }];

		let callIndex = 0;
		(db.select as any).mockImplementation(() => ({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockImplementation(() => ({
					limit: vi.fn().mockImplementation(() => {
						callIndex++;
						if (callIndex === 1) return Promise.resolve(mockDeals);
						if (callIndex === 2) return Promise.resolve(mockCompanies);
						if (callIndex === 3) return Promise.resolve(mockContacts);
						if (callIndex === 4) return Promise.resolve(mockInvoices);
						if (callIndex === 5) return Promise.resolve(mockQuotes);
						return Promise.resolve(mockProducts);
					}),
				})),
			}),
		}));

		(db.query.organizationMembers.findFirst as any).mockResolvedValue({
			organizationId: "org-1",
		});

		const caller = createCaller({
			db: db as any,
			session: {
				user: mockUser,
				expires: "2099",
			},
			headers: new Headers(),
		});

		const results = await caller.dashboard.globalSearch({ query: "enterprise" });

		expect(results.deals).toHaveLength(1);
		expect(results.deals[0]?.title).toBe("Enterprise Cloud Migration");
		expect(results.companies).toHaveLength(1);
		expect(results.companies[0]?.name).toBe("Enterprise Corp");
		expect(results.contacts).toHaveLength(1);
		expect(results.contacts[0]?.name).toBe("Jane Doe");
		expect(results.invoices).toHaveLength(1);
		expect(results.invoices[0]?.invoiceNumber).toBe("INV-ENT-001");
		expect(results.quotes).toHaveLength(1);
		expect(results.quotes[0]?.quoteNumber).toBe("Q-ENT-001");
		expect(results.products).toHaveLength(1);
		expect(results.products[0]?.name).toBe("Enterprise Appliance");
	});
});
