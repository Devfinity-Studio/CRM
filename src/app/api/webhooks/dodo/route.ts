import { type NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import {
	handlePlatformBillingWebhook,
	type PlatformBillingWebhookEvent,
} from "~/server/api/services/platform-billing";
import { db } from "~/server/db";

// In-memory bounded cache for webhook idempotency
const processedWebhookIds = new Set<string>();
const MAX_IDEMPOTENCY_CACHE = 1000;

export async function POST(req: NextRequest) {
	try {
		const webhookId = req.headers.get("webhook-id");
		const webhookSignature = req.headers.get("webhook-signature");
		const webhookTimestamp = req.headers.get("webhook-timestamp");

		const rawBody = await req.text();

		// 1. Signature Verification via Standard Webhooks specification
		const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
		if (!webhookKey && process.env.NODE_ENV === "production") {
			console.error("[Dodo Webhook] Missing DODO_PAYMENTS_WEBHOOK_KEY in production");
			return NextResponse.json(
				{ error: "Webhook configuration error" },
				{ status: 500 },
			);
		}

		if (webhookKey) {
			if (!webhookId || !webhookSignature || !webhookTimestamp) {
				return NextResponse.json(
					{ error: "Missing required Standard Webhook headers" },
					{ status: 400 },
				);
			}

			try {
				const wh = new Webhook(webhookKey);
				wh.verify(rawBody, {
					"webhook-id": webhookId,
					"webhook-signature": webhookSignature,
					"webhook-timestamp": webhookTimestamp,
				});
			} catch (err) {
				console.error(
					"[Dodo Webhook] Cryptographic signature check failed:",
					err,
				);
				return NextResponse.json(
					{ error: "Invalid webhook signature" },
					{ status: 401 },
				);
			}
		} else if (process.env.NODE_ENV !== "test") {
			return NextResponse.json(
				{ error: "Webhook signature verification required" },
				{ status: 401 },
			);
		}

		// 2. Idempotency Guard
		if (webhookId) {
			if (processedWebhookIds.has(webhookId)) {
				return NextResponse.json(
					{ received: true, message: "Duplicate webhook ignored" },
					{ status: 200 },
				);
			}

			processedWebhookIds.add(webhookId);
			if (processedWebhookIds.size > MAX_IDEMPOTENCY_CACHE) {
				const firstItem = processedWebhookIds.values().next().value;
				if (firstItem) processedWebhookIds.delete(firstItem);
			}
		}

		// 3. Payload Parsing & Normalization
		const payload = JSON.parse(rawBody);
		const eventType = payload.type || payload.event_type;

		if (!eventType) {
			return NextResponse.json(
				{ error: "Missing event type in payload" },
				{ status: 400 },
			);
		}

		const event: PlatformBillingWebhookEvent = {
			event_type: eventType,
			data: payload.data || payload,
		};

		// 4. Handle Platform Billing & Quota Upgrade
		const result = await handlePlatformBillingWebhook(db, event);

		return NextResponse.json(
			{
				received: true,
				handled: result.handled,
				updatedPlan: result.updatedPlan,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("[Dodo Webhook Handler] Error processing event:", error);
		return NextResponse.json(
			{ error: "Internal server error processing webhook" },
			{ status: 500 },
		);
	}
}
