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
			organizations: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
		},
	},
}));

vi.mock("~/server/security/audit", () => ({
	logSuperAdminAction: vi.fn().mockResolvedValue(undefined),
}));

import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import { logSuperAdminAction } from "~/server/security/audit";

describe("SuperAdmin Global Staff & User Governance Router", () => {
	const mockSuperAdmin = {
		id: "super-1",
		email: "admin@devcrm.io",
		name: "Platform Admin",
		systemRole: "SUPER_ADMIN" as const,
		organizationId: "org-hq",
	};

	const createCaller = appRouter.createCaller;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("updateUserSystemRole", () => {
		it("should elevate a regular user to SUPER_ADMIN", async () => {
			const caller = createCaller({
				session: { user: mockSuperAdmin, expires: "2099-01-01" },
				db: db as any,
				headers: new Headers(),
			});

			(db.query.users.findFirst as any).mockResolvedValue({
				id: "user-2",
				email: "operator@devcrm.io",
				systemRole: "USER",
			});

			(db.update as any).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([
							{
								id: "user-2",
								email: "operator@devcrm.io",
								systemRole: "SUPER_ADMIN",
							},
						]),
					}),
				}),
			});

			const result = await caller.superadmin.updateUserSystemRole({
				userId: "user-2",
				systemRole: "SUPER_ADMIN",
			});

			expect(result.systemRole).toBe("SUPER_ADMIN");
			expect(logSuperAdminAction).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					action: "UPDATE_USER_ROLE",
					targetId: "user-2",
					metadata: expect.objectContaining({
						newRole: "SUPER_ADMIN",
					}),
				}),
			);
		});

		it("should reject self-demotion when caller attempts to demote own account", async () => {
			const caller = createCaller({
				session: { user: mockSuperAdmin, expires: "2099-01-01" },
				db: db as any,
				headers: new Headers(),
			});

			await expect(
				caller.superadmin.updateUserSystemRole({
					userId: "super-1",
					systemRole: "USER",
				}),
			).rejects.toThrow("You cannot demote your own Super Admin account.");
		});
	});

	describe("toggleUserActiveStatus", () => {
		it("should suspend a user and invalidate their sessions", async () => {
			const caller = createCaller({
				session: { user: mockSuperAdmin, expires: "2099-01-01" },
				db: db as any,
				headers: new Headers(),
			});

			(db.query.users.findFirst as any).mockResolvedValue({
				id: "user-suspend",
				email: "badactor@devcrm.io",
				isActive: true,
			});

			(db.update as any).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([
							{
								id: "user-suspend",
								email: "badactor@devcrm.io",
								isActive: false,
							},
						]),
					}),
				}),
			});

			const mockDeleteWhere = vi.fn().mockResolvedValue([]);
			(db.delete as any).mockReturnValue({
				where: mockDeleteWhere,
			});

			const result = await caller.superadmin.toggleUserActiveStatus({
				userId: "user-suspend",
				isActive: false,
			});

			expect(result.isActive).toBe(false);
			expect(db.delete).toHaveBeenCalled();
			expect(logSuperAdminAction).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					action: "SUSPEND_USER",
					targetId: "user-suspend",
				}),
			);
		});

		it("should block self-suspension for the active super admin", async () => {
			const caller = createCaller({
				session: { user: mockSuperAdmin, expires: "2099-01-01" },
				db: db as any,
				headers: new Headers(),
			});

			await expect(
				caller.superadmin.toggleUserActiveStatus({
					userId: "super-1",
					isActive: false,
				}),
			).rejects.toThrow("You cannot suspend your own account.");
		});
	});

	describe("adminResetUserPassword", () => {
		it("should update password hash and terminate sessions", async () => {
			const caller = createCaller({
				session: { user: mockSuperAdmin, expires: "2099-01-01" },
				db: db as any,
				headers: new Headers(),
			});

			(db.query.users.findFirst as any).mockResolvedValue({
				id: "user-reset",
				email: "forgot@devcrm.io",
			});

			const mockUpdateWhere = vi.fn().mockResolvedValue([]);
			(db.update as any).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: mockUpdateWhere,
				}),
			});

			const mockDeleteWhere = vi.fn().mockResolvedValue([]);
			(db.delete as any).mockReturnValue({
				where: mockDeleteWhere,
			});

			const result = await caller.superadmin.adminResetUserPassword({
				userId: "user-reset",
				newPassword: "BrandNewSecurePassword123!",
			});

			expect(result.success).toBe(true);
			expect(db.update).toHaveBeenCalled();
			expect(db.delete).toHaveBeenCalled();
			expect(logSuperAdminAction).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					action: "RESET_USER_PASSWORD",
					targetId: "user-reset",
				}),
			);
		});
	});

	describe("revokeUserSessions", () => {
		it("should delete all active sessions for a target user", async () => {
			const caller = createCaller({
				session: { user: mockSuperAdmin, expires: "2099-01-01" },
				db: db as any,
				headers: new Headers(),
			});

			(db.query.users.findFirst as any).mockResolvedValue({
				id: "user-terminate",
				email: "sessionkill@devcrm.io",
			});

			const mockDeleteWhere = vi.fn().mockResolvedValue([]);
			(db.delete as any).mockReturnValue({
				where: mockDeleteWhere,
			});

			const result = await caller.superadmin.revokeUserSessions({
				userId: "user-terminate",
			});

			expect(result.success).toBe(true);
			expect(db.delete).toHaveBeenCalled();
			expect(logSuperAdminAction).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					action: "REVOKE_USER_SESSIONS",
					targetId: "user-terminate",
				}),
			);
		});
	});

	describe("createStaffUser", () => {
		it("should reject creation if email already exists", async () => {
			const caller = createCaller({
				session: { user: mockSuperAdmin, expires: "2099-01-01" },
				db: db as any,
				headers: new Headers(),
			});

			(db.query.users.findFirst as any).mockResolvedValue({
				id: "existing-user",
				email: "existing@devcrm.io",
			});

			await expect(
				caller.superadmin.createStaffUser({
					name: "Staff Member",
					email: "existing@devcrm.io",
					password: "Password123!",
					systemRole: "SUPER_ADMIN",
				}),
			).rejects.toThrow("A user with this email address already exists.");
		});

		it("should hash password and create active staff user", async () => {
			const caller = createCaller({
				session: { user: mockSuperAdmin, expires: "2099-01-01" },
				db: db as any,
				headers: new Headers(),
			});

			(db.query.users.findFirst as any).mockResolvedValue(null);

			(db.insert as any).mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([
						{
							id: "new-staff-1",
							name: "New Admin",
							email: "newadmin@devcrm.io",
							systemRole: "SUPER_ADMIN",
							isActive: true,
						},
					]),
				}),
			});

			const result = await caller.superadmin.createStaffUser({
				name: "New Admin",
				email: "newadmin@devcrm.io",
				password: "Password123!",
				systemRole: "SUPER_ADMIN",
			});

			expect(result.email).toBe("newadmin@devcrm.io");
			expect(result.systemRole).toBe("SUPER_ADMIN");
			expect(result.isActive).toBe(true);
			expect(logSuperAdminAction).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					action: "CREATE_STAFF_USER",
				}),
			);
		});
	});
});

