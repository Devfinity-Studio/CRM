import { addDays, isFuture, isPast } from "date-fns";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import {
	automationLogs,
	automationRules,
	communications,
	invoices,
	notifications,
	quotes,
} from "@/server/db/schema";

export async function POST(request: Request) {
	// In a real app, verify a secret token from Vercel Cron
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET || "secret"}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const rules = await db.query.automationRules.findMany({
			where: eq(automationRules.isActive, true),
		});

		let processedCount = 0;
		const now = new Date();

		for (const rule of rules) {
			if (rule.triggerType === "INVOICE_DUE") {
				const activeInvoices = await db.query.invoices.findMany({
					where: eq(invoices.organizationId, rule.organizationId),
				});

				for (const inv of activeInvoices) {
					if (!inv.dueDate || inv.status === "PAID" || inv.status === "DRAFT")
						continue;

					// Check if rule already executed for this invoice
					const existingLog = await db.query.automationLogs.findFirst({
						where: and(
							eq(automationLogs.ruleId, rule.id),
							eq(automationLogs.targetEntityId, inv.id),
						),
					});
					if (existingLog) continue;

					// Check if condition met
					// daysOffset = -3 (3 days before due) -> targetDate = due - 3 days. if targetDate <= now, trigger
					const targetDate = addDays(inv.dueDate, rule.daysOffset);
					if (isPast(targetDate)) {
						// Trigger Action
						await executeAction(
							rule,
							inv.id,
							rule.organizationId,
							inv.companyId,
							`Invoice #${inv.invoiceNumber} is due.`,
						);
						processedCount++;
					}
				}
			} else if (rule.triggerType === "QUOTE_SENT") {
				const activeQuotes = await db.query.quotes.findMany({
					where: and(
						eq(quotes.organizationId, rule.organizationId),
						eq(quotes.status, "SENT"),
					),
				});

				for (const q of activeQuotes) {
					const existingLog = await db.query.automationLogs.findFirst({
						where: and(
							eq(automationLogs.ruleId, rule.id),
							eq(automationLogs.targetEntityId, q.id),
						),
					});
					if (existingLog) continue;

					// daysOffset = 3 (3 days after sent) -> targetDate = sent + 3 days
					const targetDate = addDays(
						q.updatedAt || q.createdAt,
						rule.daysOffset,
					);
					if (isPast(targetDate)) {
						await executeAction(
							rule,
							q.id,
							rule.organizationId,
							q.companyId,
							`Quote #${q.quoteNumber} follow-up.`,
						);
						processedCount++;
					}
				}
			}
		}

		return NextResponse.json({ success: true, processedCount });
	} catch (error) {
		console.error("Cron automation error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

async function executeAction(
	rule: any,
	entityId: string,
	orgId: string,
	companyId: string | null,
	defaultMessage: string,
) {
	if (rule.actionType === "SEND_EMAIL") {
		await db.insert(communications).values({
			organizationId: orgId,
			companyId: companyId,
			targetEntityId: entityId,
			type: "EMAIL",
			subject:
				(rule.actionPayload as any)?.subject || `Follow-up: ${rule.name}`,
			body: (rule.actionPayload as any)?.body || defaultMessage,
		});
	} else if (rule.actionType === "INTERNAL_ALERT") {
		// Find org owner to notify (mocking just grabbing one user)
		const orgUsers = await db.query.organizationMembers.findMany({
			where: eq(sql`organization_id`, orgId),
		});
		if (orgUsers.length > 0) {
			await db.insert(notifications).values({
				organizationId: orgId,
				userId: orgUsers[0].userId,
				title: `Automation Alert: ${rule.name}`,
				message: defaultMessage,
				link: null,
			});
		}
	}

	await db.insert(automationLogs).values({
		organizationId: orgId,
		ruleId: rule.id,
		targetEntityId: entityId,
	});
}
