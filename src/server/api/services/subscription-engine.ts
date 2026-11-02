import { addDays, addMonths, addWeeks, addYears } from "date-fns";
import { and, eq, lte } from "drizzle-orm";
import { clientSubscriptions, invoices, products } from "~/server/db/schema";

export interface MRRCalculation {
	mrr: number; // in cents
	arr: number; // in cents
	activeSubscriptionsCount: number;
	pastDueSubscriptionsCount: number;
}

export function calculateMRRAndARR(
	subscriptionsList: Array<{
		status: string;
		billingCycle: string;
		price: number;
	}>,
): MRRCalculation {
	let totalMonthlyCents = 0;
	let activeCount = 0;
	let pastDueCount = 0;

	for (const sub of subscriptionsList) {
		if (sub.status === "ACTIVE") {
			activeCount++;
			const cycle = (sub.billingCycle || "MONTHLY").toUpperCase();
			if (cycle === "MONTHLY") {
				totalMonthlyCents += sub.price;
			} else if (cycle === "YEARLY") {
				totalMonthlyCents += Math.round(sub.price / 12);
			} else if (cycle === "WEEKLY") {
				totalMonthlyCents += Math.round((sub.price * 52) / 12);
			} else if (cycle === "DAILY") {
				totalMonthlyCents += sub.price * 30;
			}
		} else if (sub.status === "PAST_DUE") {
			pastDueCount++;
		}
	}

	const mrr = Math.round(totalMonthlyCents);
	const arr = mrr * 12;

	return {
		mrr,
		arr,
		activeSubscriptionsCount: activeCount,
		pastDueSubscriptionsCount: pastDueCount,
	};
}

export function computeNextRenewalDate(
	currentDate: Date,
	billingCycle: string,
): Date {
	const cycle = billingCycle.toUpperCase();
	if (cycle === "DAILY") return addDays(currentDate, 1);
	if (cycle === "WEEKLY") return addWeeks(currentDate, 1);
	if (cycle === "YEARLY") return addYears(currentDate, 1);
	return addMonths(currentDate, 1); // default MONTHLY
}

/**
 * Iterates through due client subscriptions and automatically generates recurring invoices.
 */
export async function processSubscriptionRenewals(
	db: any,
	organizationId: string,
) {
	const now = new Date();

	const dueSubscriptions = await db.query.clientSubscriptions.findMany({
		where: and(
			eq(clientSubscriptions.organizationId, organizationId),
			eq(clientSubscriptions.status, "ACTIVE"),
			lte(clientSubscriptions.nextRenewalDate, now),
		),
		with: {
			company: true,
			product: true,
		},
	});

	const generatedInvoices = [];

	for (const sub of dueSubscriptions) {
		const invoiceNumber = `INV-REC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
		const dueDate = addDays(now, 7);

		const lineItem = {
			id: sub.productId,
			productId: sub.productId,
			name: sub.product?.name || "Subscription Service",
			quantity: 1,
			unitPrice: sub.price,
			amount: sub.price,
		};

		// 1. Create recurring invoice
		const [inv] = await db
			.insert(invoices)
			.values({
				organizationId,
				companyId: sub.companyId,
				invoiceNumber,
				status: "SENT",
				subtotal: sub.price,
				taxAmount: 0,
				totalAmount: sub.price,
				balanceDue: sub.price,
				dueDate,
				lineItems: [lineItem],
				notes: `Automated recurring renewal for ${sub.product?.name || "service"} (${sub.billingCycle})`,
			})
			.returning();

		// 2. Advance subscription renewal date
		const nextDate = computeNextRenewalDate(now, sub.billingCycle);

		await db
			.update(clientSubscriptions)
			.set({
				lastRenewalDate: now,
				nextRenewalDate: nextDate,
				failedAttempts: 0,
				dunningStatus: "NONE",
			})
			.where(eq(clientSubscriptions.id, sub.id));

		generatedInvoices.push(inv);
	}

	return {
		processedCount: dueSubscriptions.length,
		generatedInvoices,
	};
}

/**
 * Handles dunning logic on recurring payment failure.
 */
export async function recordSubscriptionPaymentFailure(
	db: any,
	subscriptionId: string,
) {
	const sub = await db.query.clientSubscriptions.findFirst({
		where: eq(clientSubscriptions.id, subscriptionId),
	});

	if (!sub) throw new Error("Subscription not found");

	const newFailedAttempts = (sub.failedAttempts || 0) + 1;
	let newStatus = sub.status;
	let dunningStatus = "PAYMENT_FAILED";

	if (newFailedAttempts >= 3) {
		newStatus = "CANCELLED";
		dunningStatus = "CANCELLED";
	} else {
		newStatus = "PAST_DUE";
		dunningStatus = "GRACE_PERIOD";
	}

	const [updated] = await db
		.update(clientSubscriptions)
		.set({
			status: newStatus,
			failedAttempts: newFailedAttempts,
			dunningStatus,
			dunningAlertSentAt: new Date(),
		})
		.where(eq(clientSubscriptions.id, subscriptionId))
		.returning();

	return updated;
}

