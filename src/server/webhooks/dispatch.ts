import { eq } from "drizzle-orm";
import { svix } from "~/lib/svix";
import { db } from "~/server/db";
import { organizations } from "~/server/db/schema";

export async function dispatchWebhook(
	orgId: string,
	eventType: string,
	payload: any,
) {
	try {
		// 1. Get the org to check for svixAppId
		const org = await db.query.organizations.findFirst({
			where: eq(organizations.id, orgId),
		});

		// 2. If the organization has no app registered, they have no webhooks
		// (We could auto-create it, but creating an app for every org on every event
		// is wasteful if they don't use webhooks. Let the UI create the app when they configure it.)
		if (!org?.svixAppId) {
			return;
		}

		// 3. Dispatch to Svix
		await svix.message.create(org.svixAppId, {
			eventType,
			payload,
		});

		console.log(`[Webhooks] Dispatched ${eventType} for org ${orgId}`);
	} catch (error) {
		console.error(
			`[Webhooks] Failed to dispatch ${eventType} for org ${orgId}:`,
			error,
		);
		// Depending on the reliability requirements, we might want to throw here,
		// but typically webhooks shouldn't fail the main synchronous transaction.
	}
}
