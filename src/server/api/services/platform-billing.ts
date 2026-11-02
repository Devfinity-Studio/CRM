import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "~/server/db/schema";
import {
	organizations,
	subscriptionPlans,
	subscriptions,
} from "~/server/db/schema";
import { emitDomainEvent } from "~/server/events/event-bus";
import { getDodoClient, isDodoConfigured } from "~/server/payments/dodo-client";

export interface PlatformCheckoutSessionInput {
	organizationId: string;
	planId: string;
	billingCycle: "monthly" | "yearly";
	customerEmail: string;
	customerName: string;
	returnUrl: string;
}

export interface PlatformBillingWebhookEvent {
	event_type:
		| "subscription.active"
		| "subscription.renewed"
		| "subscription.cancelled"
		| "subscription.on_hold"
		| "subscription.plan_changed"
		| "payment.succeeded"
		| "payment.failed";
	data: {
		subscription_id?: string;
		customer_id?: string;
		customer?: {
			customer_id?: string;
			email?: string;
			name?: string;
		};
		metadata?: {
			organizationId?: string;
			planId?: string;
			billingCycle?: string;
		};
		product_id?: string;
		next_billing_date?: string;
		status?: string;
	};
}

/**
 * Creates a hosted checkout session URL for platform SaaS subscriptions via Dodo Payments.
 */
export async function createPlatformCheckoutSession(
	db: PostgresJsDatabase<typeof schema>,
	input: PlatformCheckoutSessionInput,
): Promise<{ checkoutUrl: string; sessionId: string }> {
	const plan = await db.query.subscriptionPlans.findFirst({
		where: eq(subscriptionPlans.id, input.planId),
	});

	if (!plan) {
		throw new Error("Target subscription plan not found.");
	}

	const sessionId = `pl_sess_${input.organizationId.slice(0, 8)}_${Date.now()}`;

	// If Dodo is configured, create live or test checkout session via official SDK
	if (isDodoConfigured()) {
		try {
			const client = getDodoClient();
			const planMetadata = (plan.metadata as Record<string, unknown>) || {};
			const productId =
				(planMetadata.dodoProductId as string) ||
				process.env.DODO_DEFAULT_PRODUCT_ID;

			if (productId) {
				const session = await client.checkoutSessions.create({
					product_cart: [{ product_id: productId, quantity: 1 }],
					customer: {
						email: input.customerEmail,
						name: input.customerName,
					},
					metadata: {
						organizationId: input.organizationId,
						planId: input.planId,
						billingCycle: input.billingCycle,
					},
					return_url: input.returnUrl,
				});

				if (session?.checkout_url) {
					return {
						checkoutUrl: session.checkout_url,
						sessionId: session.session_id || sessionId,
					};
				}
			}
		} catch (e) {
			console.error("[PlatformBilling] Dodo SDK checkoutSession error:", e);
		}
	}

	// Compliant fallback hosted URL for development & offline environments
	const checkoutUrl = `${input.returnUrl}?session_id=${sessionId}&status=success&plan_id=${input.planId}`;
	return { checkoutUrl, sessionId };
}

/**
 * Creates a hosted Customer Portal session via Dodo Payments.
 */
export async function createPlatformCustomerPortalSession(
	db: PostgresJsDatabase<typeof schema>,
	organizationId: string,
	returnUrl: string,
): Promise<{ portalUrl: string }> {
	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	});

	if (!org) {
		throw new Error("Organization not found.");
	}

	const customerId = org.dodoCustomerId;

	if (customerId && isDodoConfigured()) {
		try {
			const client = getDodoClient();
			const session = await client.customers.customerPortal.create(customerId, {
				return_url: returnUrl,
			});
			if (session?.link) {
				return { portalUrl: session.link };
			}
		} catch (e) {
			console.error("[PlatformBilling] Dodo CustomerPortal error:", e);
		}
	}

	// Fallback returnUrl if portal session cannot be generated
	return { portalUrl: `${returnUrl}?portal=unavailable` };
}

/**
 * Ingests platform SaaS billing webhooks from Dodo Payments and synchronizes tenant quotas,
 * subscription statuses, and team limits.
 */
export async function handlePlatformBillingWebhook(
	db: PostgresJsDatabase<typeof schema>,
	event: PlatformBillingWebhookEvent,
): Promise<{ success: boolean; handled: boolean; updatedPlan?: string }> {
	const orgId = event.data.metadata?.organizationId;
	const planId = event.data.metadata?.planId;
	const customerId = event.data.customer_id || event.data.customer?.customer_id;
	const subscriptionId = event.data.subscription_id;

	if (!orgId) {
		return { success: false, handled: false };
	}

	switch (event.event_type) {
		case "subscription.active":
		case "subscription.renewed":
		case "subscription.plan_changed":
		case "payment.succeeded": {
			// 1. Resolve target subscription plan to read quotas
			let targetPlan = null;
			if (planId) {
				targetPlan = await db.query.subscriptionPlans.findFirst({
					where: eq(subscriptionPlans.id, planId),
				});
			}

			// Fallback: lookup default active plan if planId wasn't directly in metadata
			if (!targetPlan && event.data.product_id) {
				const allPlans = await db.query.subscriptionPlans.findMany();
				targetPlan =
					allPlans.find((p) => {
						const meta = (p.metadata as Record<string, unknown>) || {};
						return meta.dodoProductId === event.data.product_id;
					}) || null;
			}

			// 2. Synchronize organization quotas and plan tier
			const updatePayload: Record<string, unknown> = {
				status: "ACTIVE",
			};

			if (targetPlan) {
				updatePayload.planId = targetPlan.id;
				updatePayload.plan = targetPlan.name;
				updatePayload.maxContacts = targetPlan.maxContacts;
				updatePayload.maxInvoices = targetPlan.maxInvoices;
				updatePayload.maxAutomationsMonthly = targetPlan.maxAutomationsMonthly;
				updatePayload.maxTeamSeats = targetPlan.maxTeamSeats;
				updatePayload.maxStorageMb = targetPlan.maxStorageMb;
			}

			if (customerId) {
				updatePayload.dodoCustomerId = customerId;
			}

			await db
				.update(organizations)
				.set(updatePayload)
				.where(eq(organizations.id, orgId));

			// 3. Upsert active subscription record
			const existingSub = await db.query.subscriptions.findFirst({
				where: eq(subscriptions.organizationId, orgId),
			});

			const nextBilling = event.data.next_billing_date
				? new Date(event.data.next_billing_date)
				: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

			if (existingSub) {
				await db
					.update(subscriptions)
					.set({
						status: "ACTIVE",
						currentPeriodEnd: nextBilling,
						planId: targetPlan?.id || existingSub.planId,
						dodoSubscriptionId:
							subscriptionId || existingSub.dodoSubscriptionId,
						dodoCustomerId: customerId || existingSub.dodoCustomerId,
					})
					.where(eq(subscriptions.id, existingSub.id));
			} else if (targetPlan) {
				await db.insert(subscriptions).values({
					organizationId: orgId,
					planId: targetPlan.id,
					status: "ACTIVE",
					currentPeriodEnd: nextBilling,
					dodoSubscriptionId: subscriptionId,
					dodoCustomerId: customerId,
				});
			}

			// 4. Emit domain event on event bus
			try {
				await emitDomainEvent(db, {
					type: "subscription.active",
					organizationId: orgId,
					targetEntityId: orgId,
					payload: {
						planId: targetPlan?.id,
						planName: targetPlan?.name,
						subscriptionId,
						customerId,
					},
				});
			} catch (e) {
				console.warn("[PlatformBilling] Could not emit domain event:", e);
			}

			return {
				success: true,
				handled: true,
				updatedPlan: targetPlan?.name,
			};
		}

		case "subscription.cancelled": {
			await db
				.update(subscriptions)
				.set({ status: "CANCELED" })
				.where(eq(subscriptions.organizationId, orgId));

			try {
				await emitDomainEvent(db, {
					type: "subscription.cancelled",
					organizationId: orgId,
					targetEntityId: orgId,
					payload: { subscriptionId },
				});
			} catch (e) {
				console.warn("[PlatformBilling] Could not emit domain event:", e);
			}

			return { success: true, handled: true };
		}

		case "payment.failed":
		case "subscription.on_hold": {
			await db
				.update(subscriptions)
				.set({ status: "PAST_DUE" })
				.where(eq(subscriptions.organizationId, orgId));
			return { success: true, handled: true };
		}

		default:
			return { success: true, handled: false };
	}
}
