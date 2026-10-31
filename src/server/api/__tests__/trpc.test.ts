import crypto from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "~/server/db";
import { createTRPCContext } from "../trpc";

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
		expect((ctx.session?.user as any).organizationId).toBe("org-123");
	});
});
