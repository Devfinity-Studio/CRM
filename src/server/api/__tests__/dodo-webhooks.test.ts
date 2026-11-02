import { Webhook } from "svix";
import { describe, expect, it, vi } from "vitest";
import {
	handlePlatformBillingWebhook,
	type PlatformBillingWebhookEvent,
} from "~/server/api/services/platform-billing";
import { organizations, subscriptions } from "~/server/db/schema";

// Mock dispatchWebhook to prevent real network calls during tests
vi.mock("~/server/webhooks/dispatch", () => ({
	dispatchWebhook: vi.fn().mockResolvedValue(true),
}));

describe("Dodo Payments Webhook & Platform Quota Sync", () => {
	// Standard Webhooks requires valid base64 after "whsec_"
	const base64Secret = Buffer.from(
		"test_secret_key_1234567890abcdef_32_bytes_len",
	).toString("base64");
	const secret = `whsec_${base64Secret}`;

	it("should cryptographically verify valid Standard Webhook signatures", () => {
		const wh = new Webhook(secret);
		const payload = JSON.stringify({
			type: "subscription.active",
			data: { metadata: { organizationId: "org-test-1" } },
		});
		const timestamp = new Date();
		const msgId = "msg_test_001";

		// svix wh.sign takes (msgId, timestamp, payload)
		const signature = wh.sign(msgId, timestamp, payload);

		expect(signature).toContain("v1,");

		// Verification with correct headers succeeds without throwing
		expect(() =>
			wh.verify(payload, {
				"webhook-id": msgId,
				"webhook-signature": signature,
				"webhook-timestamp": Math.floor(timestamp.getTime() / 1000).toString(),
			}),
		).not.toThrow();

		const parsed = JSON.parse(payload);
		expect(parsed.type).toBe("subscription.active");
	});

	it("should reject tampered or invalid signatures", () => {
		const wh = new Webhook(secret);
		const payload = JSON.stringify({ type: "subscription.active" });
		const timestamp = new Date();

		expect(() => {
			wh.verify(payload, {
				"webhook-id": "msg_tampered",
				"webhook-signature": "v1,invalid_signature_xyz",
				"webhook-timestamp": Math.floor(timestamp.getTime() / 1000).toString(),
			});
		}).toThrow();
	});

	it("should synchronize organization quotas on subscription.active", async () => {
		const updatedOrgData: any = {};
		const updatedSubData: any = {};

		const mockDb: any = {
			query: {
				subscriptionPlans: {
					findFirst: vi.fn().mockResolvedValue({
						id: "plan-pro-123",
						name: "Pro Plan",
						maxContacts: 10000,
						maxInvoices: 2500,
						maxAutomationsMonthly: 50000,
						maxTeamSeats: 25,
						maxStorageMb: 50000,
					}),
					findMany: vi.fn().mockResolvedValue([]),
				},
				subscriptions: {
					findFirst: vi.fn().mockResolvedValue({
						id: "sub-record-1",
						organizationId: "org-1",
						status: "TRIAL",
					}),
				},
				organizations: {
					findFirst: vi.fn().mockResolvedValue({
						id: "org-1",
						name: "Acme Corp",
						plan: "FREE",
					}),
				},
				automationRules: {
					findMany: vi.fn().mockResolvedValue([]),
				},
			},
			update: vi.fn((table) => ({
				set: vi.fn((data) => {
					if (table === organizations) {
						Object.assign(updatedOrgData, data);
					}
					if (table === subscriptions) {
						Object.assign(updatedSubData, data);
					}
					return {
						where: vi.fn().mockResolvedValue([{ id: "updated" }]),
					};
				}),
			})),
			insert: vi.fn(() => ({
				values: vi.fn().mockResolvedValue([{ id: "inserted" }]),
			})),
		};

		const event: PlatformBillingWebhookEvent = {
			event_type: "subscription.active",
			data: {
				subscription_id: "sub_dodo_987",
				customer_id: "cus_dodo_555",
				metadata: {
					organizationId: "org-1",
					planId: "plan-pro-123",
				},
				next_billing_date: new Date(Date.now() + 30 * 86400000).toISOString(),
			},
		};

		const result = await handlePlatformBillingWebhook(mockDb, event);

		expect(result.success).toBe(true);
		expect(result.handled).toBe(true);
		expect(result.updatedPlan).toBe("Pro Plan");

		// Verify organization quota upgrades
		expect(updatedOrgData.planId).toBe("plan-pro-123");
		expect(updatedOrgData.plan).toBe("Pro Plan");
		expect(updatedOrgData.status).toBe("ACTIVE");
		expect(updatedOrgData.maxContacts).toBe(10000);
		expect(updatedOrgData.maxInvoices).toBe(2500);
		expect(updatedOrgData.maxAutomationsMonthly).toBe(50000);
		expect(updatedOrgData.maxTeamSeats).toBe(25);
		expect(updatedOrgData.maxStorageMb).toBe(50000);
		expect(updatedOrgData.dodoCustomerId).toBe("cus_dodo_555");

		// Verify subscription record updated
		expect(updatedSubData.status).toBe("ACTIVE");
		expect(updatedSubData.dodoSubscriptionId).toBe("sub_dodo_987");
	});

	it("should update subscription status to CANCELED on subscription.cancelled", async () => {
		const updatedSubData: any = {};

		const mockDb: any = {
			query: {
				subscriptions: {
					findFirst: vi.fn().mockResolvedValue({ id: "sub-1" }),
				},
				automationRules: {
					findMany: vi.fn().mockResolvedValue([]),
				},
			},
			update: vi.fn(() => ({
				set: vi.fn((data) => {
					Object.assign(updatedSubData, data);
					return {
						where: vi.fn().mockResolvedValue([{ id: "sub-1" }]),
					};
				}),
			})),
		};

		const event: PlatformBillingWebhookEvent = {
			event_type: "subscription.cancelled",
			data: {
				subscription_id: "sub_dodo_987",
				metadata: { organizationId: "org-1" },
			},
		};

		const result = await handlePlatformBillingWebhook(mockDb, event);
		expect(result.success).toBe(true);
		expect(result.handled).toBe(true);
		expect(updatedSubData.status).toBe("CANCELED");
	});

	it("should update subscription status to PAST_DUE on payment.failed or on_hold", async () => {
		const updatedSubData: any = {};

		const mockDb: any = {
			query: {
				automationRules: {
					findMany: vi.fn().mockResolvedValue([]),
				},
			},
			update: vi.fn(() => ({
				set: vi.fn((data) => {
					Object.assign(updatedSubData, data);
					return {
						where: vi.fn().mockResolvedValue([{ id: "sub-1" }]),
					};
				}),
			})),
		};

		const event: PlatformBillingWebhookEvent = {
			event_type: "payment.failed",
			data: {
				metadata: { organizationId: "org-1" },
			},
		};

		const result = await handlePlatformBillingWebhook(mockDb, event);
		expect(result.success).toBe(true);
		expect(result.handled).toBe(true);
		expect(updatedSubData.status).toBe("PAST_DUE");
	});
});
