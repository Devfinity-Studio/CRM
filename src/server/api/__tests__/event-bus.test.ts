import { describe, expect, it, vi } from "vitest";
import {
	evaluateCondition,
	evaluateConditions,
	emitDomainEvent,
} from "~/server/events/event-bus";

// Mock Svix dispatch
vi.mock("~/server/webhooks/dispatch", () => ({
	dispatchWebhook: vi.fn().mockResolvedValue(true),
}));

describe("Cross-Module Event Bus & Condition Runner", () => {
	it("should accurately evaluate condition operators (EQUALS, GREATER_THAN, CONTAINS)", () => {
		const data = {
			value: 500000,
			title: "Enterprise Deal Acme",
			status: "WON",
		};

		expect(
			evaluateCondition(data, {
				field: "value",
				operator: "GREATER_THAN",
				value: 100000,
			}),
		).toBe(true);

		expect(
			evaluateCondition(data, {
				field: "status",
				operator: "EQUALS",
				value: "won",
			}),
		).toBe(true);

		expect(
			evaluateCondition(data, {
				field: "title",
				operator: "CONTAINS",
				value: "acme",
			}),
		).toBe(true);

		expect(
			evaluateCondition(data, {
				field: "value",
				operator: "LESS_THAN",
				value: 100000,
			}),
		).toBe(false);
	});

	it("should evaluate multi-condition trees with ALL (AND) and ANY (OR) logic", () => {
		const data = {
			value: 750000,
			status: "WON",
			industry: "Technology",
		};

		// ALL (AND)
		expect(
			evaluateConditions(data, {
				matchType: "ALL",
				conditions: [
					{ field: "value", operator: "GREATER_THAN", value: 500000 },
					{ field: "status", operator: "EQUALS", value: "WON" },
				],
			}),
		).toBe(true);

		expect(
			evaluateConditions(data, {
				matchType: "ALL",
				conditions: [
					{ field: "value", operator: "GREATER_THAN", value: 500000 },
					{ field: "industry", operator: "EQUALS", value: "Healthcare" },
				],
			}),
		).toBe(false);

		// ANY (OR)
		expect(
			evaluateConditions(data, {
				matchType: "ANY",
				conditions: [
					{ field: "industry", operator: "EQUALS", value: "Healthcare" },
					{ field: "status", operator: "EQUALS", value: "WON" },
				],
			}),
		).toBe(true);
	});

	it("should process matching automation rules and log execution", async () => {
		const mockRule = {
			id: "rule-1",
			name: "VIP Deal Task Creation",
			triggerType: "DEAL_WON",
			actionType: "CREATE_TASK",
			actionPayload: {
				title: "Send Onboarding Kit",
			},
			conditions: {
				matchType: "ALL",
				conditions: [
					{ field: "value", operator: "GREATER_THAN", value: 100000 },
				],
			},
		};

		let loggedStatus = "";

		const mockDb = {
			query: {
				automationRules: {
					findMany: vi.fn().mockResolvedValue([mockRule]),
				},
			},
			insert: vi.fn().mockImplementation((table) => ({
				values: vi.fn().mockImplementation((val) => {
					if (val.ruleId) {
						loggedStatus = val.status;
					}
					return Promise.resolve([val]);
				}),
			})),
		};

		const result = await emitDomainEvent(mockDb, {
			type: "deal.won",
			organizationId: "org-1",
			targetEntityId: "deal-100",
			payload: {
				dealId: "deal-100",
				value: 250000,
				title: "Acme Cloud",
			},
		});

		expect(result.rulesEvaluated).toBe(1);
		expect(result.actionsExecuted).toBe(1);
		expect(loggedStatus).toBe("SUCCESS");
	});
});
