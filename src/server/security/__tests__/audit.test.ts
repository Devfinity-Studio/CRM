import { describe, expect, it, vi } from "vitest";
import { logSuperAdminAction } from "../audit";

describe("Super Admin Audit Logging Utility", () => {
	it("should insert audit log record with stringified metadata", async () => {
		const mockInsertValues = vi.fn().mockResolvedValue([]);
		const mockDb = {
			insert: vi.fn().mockReturnValue({
				values: mockInsertValues,
			}),
		};

		await logSuperAdminAction(mockDb as any, {
			actorId: "superadmin-1",
			actorEmail: "admin@devcrm.io",
			action: "IMPERSONATE_ORG",
			targetType: "ORGANIZATION",
			targetId: "org-123",
			metadata: { organizationName: "Acme Corp", slug: "acme" },
			ipAddress: "192.168.1.1",
		});

		expect(mockDb.insert).toHaveBeenCalled();
		expect(mockInsertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				actorId: "superadmin-1",
				actorEmail: "admin@devcrm.io",
				action: "IMPERSONATE_ORG",
				targetType: "ORGANIZATION",
				targetId: "org-123",
				metadata: JSON.stringify({
					organizationName: "Acme Corp",
					slug: "acme",
				}),
				ipAddress: "192.168.1.1",
			}),
		);
	});

	it("should handle null metadata and optional fields gracefully", async () => {
		const mockInsertValues = vi.fn().mockResolvedValue([]);
		const mockDb = {
			insert: vi.fn().mockReturnValue({
				values: mockInsertValues,
			}),
		};

		await logSuperAdminAction(mockDb as any, {
			actorId: "superadmin-1",
			actorEmail: "admin@devcrm.io",
			action: "STOP_IMPERSONATION",
		});

		expect(mockInsertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				actorId: "superadmin-1",
				actorEmail: "admin@devcrm.io",
				action: "STOP_IMPERSONATION",
				targetType: null,
				targetId: null,
				metadata: null,
				ipAddress: null,
			}),
		);
	});

	it("should contain database exceptions without throwing", async () => {
		const mockDb = {
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockRejectedValue(new Error("Database connection closed")),
			}),
		};

		// Should not throw
		await expect(
			logSuperAdminAction(mockDb as any, {
				actorId: "superadmin-1",
				actorEmail: "admin@devcrm.io",
				action: "FAILED_ACTION",
			}),
		).resolves.not.toThrow();
	});
});

