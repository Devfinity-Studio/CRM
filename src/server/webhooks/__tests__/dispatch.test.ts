import { beforeEach, describe, expect, it, vi } from "vitest";
import { svix } from "~/lib/svix";
import { db } from "~/server/db";
import { dispatchWebhook } from "../dispatch";

// Mock the external svix library and our database
vi.mock("~/lib/svix", () => ({
	svix: {
		message: {
			create: vi.fn(),
		},
	},
}));

vi.mock("~/server/db", () => ({
	db: {
		query: {
			organizations: {
				findFirst: vi.fn(),
			},
		},
	},
}));

describe("Webhooks Dispatch Utility", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should not dispatch if the organization does not have a svixAppId", async () => {
		// Mock db to return an org with NO svixAppId
		(db.query.organizations.findFirst as any).mockResolvedValue({
			id: "org-1",
			svixAppId: null,
		});

		await dispatchWebhook("org-1", "test.event", { data: 123 });

		expect(db.query.organizations.findFirst).toHaveBeenCalledTimes(1);
		expect(svix.message.create).not.toHaveBeenCalled();
	});

	it("should dispatch webhook to svix if organization has svixAppId", async () => {
		// Mock db to return an org WITH svixAppId
		(db.query.organizations.findFirst as any).mockResolvedValue({
			id: "org-2",
			svixAppId: "app-12345",
		});

		await dispatchWebhook("org-2", "invoice.created", { invoiceId: "inv-1" });

		expect(db.query.organizations.findFirst).toHaveBeenCalledTimes(1);
		expect(svix.message.create).toHaveBeenCalledTimes(1);
		expect(svix.message.create).toHaveBeenCalledWith("app-12345", {
			eventType: "invoice.created",
			payload: { invoiceId: "inv-1" },
		});
	});

	it("should catch errors from svix and not crash the application", async () => {
		// Mock db to return an org WITH svixAppId
		(db.query.organizations.findFirst as any).mockResolvedValue({
			id: "org-3",
			svixAppId: "app-error",
		});

		// Make svix throw an error
		(svix.message.create as any).mockRejectedValue(new Error("Network Error"));

		// Suppress console.error for this test
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		// Should not throw
		await expect(
			dispatchWebhook("org-3", "test.error", {}),
		).resolves.not.toThrow();

		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});
});
