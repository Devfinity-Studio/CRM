import bcrypt from "bcryptjs";
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
			users: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
		},
	},
}));

import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

describe("Auth Router - User Registration & Validation", () => {
	const createCaller = appRouter.createCaller;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should register a new user with hashed password and active status", async () => {
		const caller = createCaller({
			session: null,
			db: db as any,
			headers: new Headers(),
		});

		(db.query.users.findFirst as any).mockResolvedValue(null);

		const mockInsertValues = vi.fn().mockResolvedValue([]);
		(db.insert as any).mockReturnValue({
			values: mockInsertValues,
		});

		const result = await caller.auth.register({
			name: "Jane Doe",
			email: "Jane.Doe@example.com",
			phone: "+1234567890",
			password: "SecurePassword123!",
		});

		expect(result).toEqual({ success: true });
		expect(db.query.users.findFirst).toHaveBeenCalled();
		expect(db.insert).toHaveBeenCalled();

		const insertedUser = mockInsertValues.mock.calls[0][0];
		expect(insertedUser.email).toBe("jane.doe@example.com");
		expect(insertedUser.name).toBe("Jane Doe");
		expect(insertedUser.isActive).toBe(true);
		expect(insertedUser.systemRole).toBe("USER");
		expect(insertedUser.passwordHash).not.toBe("SecurePassword123!");

		const passwordMatches = await bcrypt.compare(
			"SecurePassword123!",
			insertedUser.passwordHash,
		);
		expect(passwordMatches).toBe(true);
	});

	it("should reject registration if email is already taken", async () => {
		const caller = createCaller({
			session: null,
			db: db as any,
			headers: new Headers(),
		});

		(db.query.users.findFirst as any).mockResolvedValue({
			id: "existing-user-1",
			email: "jane.doe@example.com",
		});

		await expect(
			caller.auth.register({
				name: "Jane Duplicate",
				email: "Jane.Doe@example.com",
				password: "Password123!",
			}),
		).rejects.toThrow("A user with this email or phone already exists");
	});
});
