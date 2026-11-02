import { and, eq } from "drizzle-orm";
import {
	automationLogs,
	automationRules,
	communications,
	crmTasks,
	notifications,
} from "~/server/db/schema";
import { dispatchWebhook } from "~/server/webhooks/dispatch";

export type DomainEventType =
	| "deal.stage_changed"
	| "deal.won"
	| "invoice.created"
	| "invoice.paid"
	| "inventory.low_stock"
	| "quote.accepted";

export interface DomainEvent<T = any> {
	type: DomainEventType;
	organizationId: string;
	targetEntityId: string;
	payload: T;
	timestamp?: Date;
}

export interface RuleCondition {
	field: string;
	operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS";
	value: any;
}

export interface RuleConditionsConfig {
	matchType?: "ALL" | "ANY"; // "ALL" = AND, "ANY" = OR
	conditions?: RuleCondition[];
}

export function evaluateCondition(data: any, cond: RuleCondition): boolean {
	const val = data?.[cond.field];
	if (val === undefined || val === null) return false;

	switch (cond.operator) {
		case "EQUALS":
			return String(val).toLowerCase() === String(cond.value).toLowerCase();
		case "NOT_EQUALS":
			return String(val).toLowerCase() !== String(cond.value).toLowerCase();
		case "GREATER_THAN":
			return Number(val) > Number(cond.value);
		case "LESS_THAN":
			return Number(val) < Number(cond.value);
		case "CONTAINS":
			return String(val)
				.toLowerCase()
				.includes(String(cond.value).toLowerCase());
		default:
			return true;
	}
}

export function evaluateConditions(
	data: any,
	config?: RuleConditionsConfig | null,
): boolean {
	if (!config || !config.conditions || config.conditions.length === 0) {
		return true; // No conditions = match all
	}

	const matchType = config.matchType ?? "ALL";
	if (matchType === "ANY") {
		return config.conditions.some((c) => evaluateCondition(data, c));
	}
	return config.conditions.every((c) => evaluateCondition(data, c));
}

const EVENT_TO_TRIGGER_MAP: Record<DomainEventType, string> = {
	"deal.stage_changed": "DEAL_STAGE_CHANGED",
	"deal.won": "DEAL_WON",
	"invoice.created": "INVOICE_CREATED",
	"invoice.paid": "INVOICE_PAID",
	"inventory.low_stock": "INVENTORY_LOW_STOCK",
	"quote.accepted": "QUOTE_ACCEPTED",
};

/**
 * Executes cross-module domain event propagation:
 * 1. Dispatches outbound Svix webhooks for the tenant.
 * 2. Evaluates active automation rules and their multi-condition trees.
 * 3. Executes actions (Tasks, Notifications, Emails, Webhooks, Inventory adjustments).
 * 4. Logs audit trail in automationLogs.
 */
export async function emitDomainEvent(db: any, event: DomainEvent) {
	const timestamp = event.timestamp ?? new Date();

	// 1. Dispatch outbound tenant webhook via Svix
	try {
		await dispatchWebhook(event.organizationId, event.type, {
			targetEntityId: event.targetEntityId,
			...event.payload,
			emittedAt: timestamp,
		});
	} catch (webhookErr) {
		console.warn(
			`[EventBus] Webhook dispatch error for ${event.type}:`,
			webhookErr,
		);
	}

	// 2. Fetch matching active automation rules
	const triggerType = EVENT_TO_TRIGGER_MAP[event.type];
	if (!triggerType) return { rulesEvaluated: 0, actionsExecuted: 0 };

	const activeRules = await db.query.automationRules.findMany({
		where: and(
			eq(automationRules.organizationId, event.organizationId),
			eq(automationRules.isActive, true),
			eq(automationRules.triggerType, triggerType as any),
		),
	});

	let actionsExecuted = 0;

	for (const rule of activeRules) {
		const isMatch = evaluateConditions(
			event.payload,
			rule.conditions as RuleConditionsConfig,
		);

		if (!isMatch) continue;

		try {
			const actionType = rule.actionType;
			const payload = (rule.actionPayload as any) || {};

			if (actionType === "CREATE_TASK") {
				await db.insert(crmTasks).values({
					organizationId: event.organizationId,
					title: payload.title || `Follow-up: ${event.type}`,
					description:
						payload.description || `Automated task triggered by ${event.type}`,
					priority: payload.priority || "MEDIUM",
					status: "PENDING",
					dealId: event.payload?.dealId ?? null,
					companyId: event.payload?.companyId ?? null,
				});
				actionsExecuted++;
			} else if (actionType === "CREATE_NOTIFICATION") {
				await db.insert(notifications).values({
					organizationId: event.organizationId,
					userId: payload.userId || event.payload?.assignedUserId || "system",
					title: payload.title || `Automation: ${rule.name}`,
					message:
						payload.message || `Event ${event.type} processed successfully.`,
					type: "AUTOMATION",
					link: payload.link || `/deals/${event.targetEntityId}`,
				});
				actionsExecuted++;
			} else if (actionType === "SEND_EMAIL") {
				await db.insert(communications).values({
					organizationId: event.organizationId,
					companyId: event.payload?.companyId ?? null,
					targetEntityId: event.targetEntityId,
					type: "EMAIL",
					subject: payload.subject || `Notification regarding ${event.type}`,
					body:
						payload.body ||
						`Automated notification triggered by rule ${rule.name}`,
				});
				actionsExecuted++;
			} else if (actionType === "DISPATCH_WEBHOOK") {
				await dispatchWebhook(event.organizationId, `custom.${rule.name}`, {
					event: event.type,
					targetId: event.targetEntityId,
					...event.payload,
				});
				actionsExecuted++;
			}

			// Record execution in audit logs
			await db.insert(automationLogs).values({
				organizationId: event.organizationId,
				ruleId: rule.id,
				targetEntityId: event.targetEntityId,
				status: "SUCCESS",
				details: {
					event: event.type,
					action: rule.actionType,
					timestamp,
				},
				executedAt: timestamp,
			});
		} catch (actionErr: any) {
			console.error(`[EventBus] Action failed for rule ${rule.id}:`, actionErr);
			await db.insert(automationLogs).values({
				organizationId: event.organizationId,
				ruleId: rule.id,
				targetEntityId: event.targetEntityId,
				status: "FAILED",
				details: {
					event: event.type,
					error: actionErr.message,
					timestamp,
				},
				executedAt: timestamp,
			});
		}
	}

	return {
		rulesEvaluated: activeRules.length,
		actionsExecuted,
	};
}
