import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "~/server/db";
import { createTRPCContext, resolveTenantContext } from "../trpc";

// Mock auth
vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

import { auth } from "~/server/auth";

// Mock db
vi.mock("~/server/db", () => ({
	db: {
		query: {
			apiKeys: {
				findFirst: vi.fn(),
			},
			organizationMembers: {
				findFirst: vi.fn(),
			},
			organizations: {
				findFirst: vi.fn(),
			},
		},
	},
}));

describe("TRPC Context - API Key Authentication", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return normal session if auth() succeeds", async () => {
		(auth as any).mockResolvedValue({ user: { id: "u-1" }, expires: "2099" });
		const headers = new Headers();
		const ctx = await createTRPCContext({ headers });
		expect(ctx.session?.user.id).toBe("u-1");
	});

	it("should look for Authorization header if no session", async () => {
		(auth as any).mockResolvedValue(null);
		const headers = new Headers();
		headers.set("Authorization", "Bearer mock-key");

		// Simulate DB failure/not found
		(db.query.apiKeys.findFirst as any).mockResolvedValue(null);

		const ctx = await createTRPCContext({ headers });
		expect(ctx.session).toBeNull();

		// Check that it hashed the key properly
		const expectedHash = crypto
			.createHash("sha256")
			.update("mock-key")
			.digest("hex");
		expect(db.query.apiKeys.findFirst).toHaveBeenCalled();
		expect(expectedHash).toBeDefined();
	});

	it("should mock a session if a valid API Key is provided", async () => {
		(auth as any).mockResolvedValue(null);
		const headers = new Headers();
		headers.set("x-api-key", "my-valid-key");

		(db.query.apiKeys.findFirst as any).mockResolvedValue({
			id: "key-1",
			keyHash: "hashed-version",
			organizationId: "org-123",
			user: {
				id: "u-api",
				email: "api@test.com",
				name: "API User",
				systemRole: "USER",
			},
		});

		const ctx = await createTRPCContext({ headers });

		expect(ctx.session?.user.id).toBe("u-api");
		expect(ctx.session?.user.email).toBe("api@test.com");
		// The organization ID injected into the mock session
		expect(ctx.session?.user && (ctx.session.user as any).organizationId).toBe(
			"org-123",
		);
	});
});

describe("resolveTenantContext - Multi-Tenant Isolation & Impersonation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should resolve tenant context via impersonatedOrgId for Super Admin", async () => {
		const ctx = {
			db,
			session: {
				user: {
					id: "superadmin-1",
					systemRole: "SUPER_ADMIN",
					organizationId: "default-org",
				},
			},
			impersonatedOrgId: "impersonated-org-99",
		};

		const tenant = await resolveTenantContext(ctx as any);
		expect(tenant.organizationId).toBe("impersonated-org-99");
		expect(tenant.isOwner).toBe(true);
		expect(tenant.isAdmin).toBe(true);
		expect(tenant.role).toBe("SUPER_ADMIN");
	});

	it("should resolve tenant context from x-tenant-id header for regular user with membership", async () => {
		(db.query.organizationMembers.findFirst as any).mockResolvedValue({
			organizationId: "org-header-456",
			userId: "user-123",
			role: "ADMIN",
		});

		const headers = new Headers();
		headers.set("x-tenant-id", "org-header-456");

		const ctx = {
			db,
			session: {
				user: {
					id: "user-123",
					systemRole: "USER",
					organizationId: "fallback-org",
				},
			},
			headers,
		};

		const tenant = await resolveTenantContext(ctx as any);
		expect(tenant.organizationId).toBe("org-header-456");
		expect(tenant.role).toBe("ADMIN");
		expect(tenant.isAdmin).toBe(true);
		expect(tenant.isOwner).toBe(false);
	});

	it("should throw FORBIDDEN when user has no active tenant membership", async () => {
		(db.query.organizationMembers.findFirst as any).mockResolvedValue(null);

		const ctx = {
			db,
			session: {
				user: {
					id: "user-unattached",
					systemRole: "USER",
				},
			},
		};

		await expect(resolveTenantContext(ctx as any)).rejects.toThrow(
			"No active tenant membership found.",
		);
	});
});
