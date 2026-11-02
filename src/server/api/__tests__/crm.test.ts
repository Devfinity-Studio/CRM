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

describe("CRM Router", () => {
	const mockUser = {
		id: "user-crm-1",
		email: "crm-tester@devcrm.io",
		name: "CRM Tester",
		systemRole: "USER" as const,
		organizationId: "org-crm-100",
	};

	const createCaller = appRouter.createCaller;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should get companies scoped to the user's organization", async () => {
		vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue({
			organizationId: "org-crm-100",
			userId: "user-crm-1",
			role: "OWNER",
		} as any);

		const mockCompanies = [
			{
				id: "comp-1",
				organizationId: "org-crm-100",
				name: "Acme Corp",
				domain: "acme.corp",
				industry: "Technology",
			},
			{
				id: "comp-2",
				organizationId: "org-crm-100",
				name: "Globex Industries",
				domain: "globex.io",
				industry: "Manufacturing",
			},
		];

		const mockFrom = vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				orderBy: vi.fn().mockResolvedValue(mockCompanies),
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

		const result = await caller.crm.getCompanies();

		expect(result).toHaveLength(2);
		expect(result[0]?.name).toBe("Acme Corp");
		expect(result[1]?.name).toBe("Globex Industries");
	});

	it("should retrieve POC contacts by companyId", async () => {
		vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue({
			organizationId: "org-crm-100",
			userId: "user-crm-1",
			role: "OWNER",
		} as any);

		const mockPOCs = [
			{
				id: "poc-1",
				organizationId: "org-crm-100",
				companyId: "comp-1",
				firstName: "Sarah",
				lastName: "Connor",
				email: "sarah@acme.corp",
				leadScore: 90,
				qualificationStatus: "SQL",
			},
		];

		const mockFrom = vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				orderBy: vi.fn().mockResolvedValue(mockPOCs),
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

		const result = await caller.crm.getPOCsByCompanyId({
			companyId: "comp-1",
		});

		expect(result).toHaveLength(1);
		expect(result[0]?.firstName).toBe("Sarah");
		expect(result[0]?.leadScore).toBe(90);
		expect(result[0]?.qualificationStatus).toBe("SQL");
	});

	it("should create a new company scoped to organization", async () => {
		vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue({
			organizationId: "org-crm-100",
			userId: "user-crm-1",
			role: "OWNER",
		} as any);

		const createdCompany = {
			id: "comp-new-1",
			organizationId: "org-crm-100",
			name: "Initech LLC",
			domain: "initech.com",
			industry: "Software",
		};

		vi.mocked(db.insert).mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([createdCompany]),
			}),
		} as any);

		const caller = createCaller({
			session: {
				user: mockUser,
				expires: "2099-01-01",
			},
			db: db as any,
		});

		const result = await caller.crm.createCompany({
			name: "Initech LLC",
			domain: "initech.com",
			industry: "Software",
		});

		expect(result).toBeDefined();
		expect(result.id).toBe("comp-new-1");
		expect(result.name).toBe("Initech LLC");
		expect(result.organizationId).toBe("org-crm-100");
	});

	it("should create a new contact with leadScore and qualificationStatus", async () => {
		vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue({
			organizationId: "org-crm-100",
			userId: "user-crm-1",
			role: "OWNER",
		} as any);

		// Mock select count for UID generation
		const mockCount = [{ count: 5 }];
		vi.mocked(db.select).mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(mockCount),
			}),
		} as any);

		const createdContact = {
			id: "contact-new-1",
			uid: "POC-0006",
			organizationId: "org-crm-100",
			companyId: "comp-1",
			firstName: "Peter",
			lastName: "Gibbons",
			email: "peter@initech.com",
			leadScore: 75,
			qualificationStatus: "MQL",
		};

		vi.mocked(db.insert).mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([createdContact]),
			}),
		} as any);

		const caller = createCaller({
			session: {
				user: mockUser,
				expires: "2099-01-01",
			},
			db: db as any,
		});

		const result = await caller.crm.createContact({
			companyId: "comp-1",
			firstName: "Peter",
			lastName: "Gibbons",
			email: "peter@initech.com",
			leadScore: 75,
			qualificationStatus: "MQL",
		});

		expect(result).toBeDefined();
		expect(result.uid).toBe("POC-0006");
		expect(result.leadScore).toBe(75);
		expect(result.qualificationStatus).toBe("MQL");
	});
});
