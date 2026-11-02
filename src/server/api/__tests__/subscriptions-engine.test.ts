import { describe, expect, it, vi } from "vitest";
import {
	calculateMRRAndARR,
	computeNextRenewalDate,
	recordSubscriptionPaymentFailure,
} from "~/server/api/services/subscription-engine";

describe("Subscription Engine & Dunning Logic", () => {
	it("should accurately calculate MRR and ARR across mixed billing cycles", () => {
		const mockSubscriptions = [
			{ status: "ACTIVE", billingCycle: "MONTHLY", price: 10000 }, // $100/mo
			{ status: "ACTIVE", billingCycle: "MONTHLY", price: 20000 }, // $200/mo
			{ status: "ACTIVE", billingCycle: "YEARLY", price: 120000 },  // $1,200/yr = $100/mo
			{ status: "ACTIVE", billingCycle: "WEEKLY", price: 2500 },    // $25/wk = $108/mo
			{ status: "CANCELLED", billingCycle: "MONTHLY", price: 50000 },
			{ status: "PAST_DUE", billingCycle: "MONTHLY", price: 15000 },
		];

		const result = calculateMRRAndARR(mockSubscriptions);

		expect(result.activeSubscriptionsCount).toBe(4);
		expect(result.pastDueSubscriptionsCount).toBe(1);
		// 10000 + 20000 + 10000 + 10833 = 50833
		expect(result.mrr).toBe(50833);
		expect(result.arr).toBe(50833 * 12);
	});

	it("should compute next renewal date accurately for all cycles", () => {
		const baseDate = new Date("2026-01-01T00:00:00Z");

		const daily = computeNextRenewalDate(baseDate, "DAILY");
		expect(daily.getUTCDate()).toBe(2);

		const weekly = computeNextRenewalDate(baseDate, "WEEKLY");
		expect(weekly.getUTCDate()).toBe(8);

		const monthly = computeNextRenewalDate(baseDate, "MONTHLY");
		expect(monthly.getUTCMonth()).toBe(1); // February

		const yearly = computeNextRenewalDate(baseDate, "YEARLY");
		expect(yearly.getUTCFullYear()).toBe(2027);
	});

	it("should handle dunning escalation on consecutive payment failures", async () => {
		const mockSub = {
			id: "sub-100",
			status: "ACTIVE",
			failedAttempts: 1,
		};

		let updatedSub: any = null;

		const mockDb = {
			query: {
				clientSubscriptions: {
					findFirst: vi.fn().mockResolvedValue(mockSub),
				},
			},
			update: vi.fn().mockReturnValue({
				set: vi.fn().mockImplementation((vals) => {
					updatedSub = { ...mockSub, ...vals };
					return {
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([updatedSub]),
						}),
					};
				}),
			}),
		};

		// 2nd failure -> GRACE_PERIOD
		const attempt2 = await recordSubscriptionPaymentFailure(mockDb, "sub-100");
		expect(attempt2.failedAttempts).toBe(2);
		expect(attempt2.status).toBe("PAST_DUE");
		expect(attempt2.dunningStatus).toBe("GRACE_PERIOD");

		// 3rd failure -> CANCELLED
		mockSub.failedAttempts = 2;
		const attempt3 = await recordSubscriptionPaymentFailure(mockDb, "sub-100");
		expect(attempt3.failedAttempts).toBe(3);
		expect(attempt3.status).toBe("CANCELLED");
		expect(attempt3.dunningStatus).toBe("CANCELLED");
	});
});

