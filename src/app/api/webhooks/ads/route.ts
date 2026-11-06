import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { adCampaigns, contacts } from "~/server/db/schema";

const adWebhookSchema = z.object({
	campaignId: z.string().min(1, "Campaign ID is required"),
	leadName: z.string().min(1, "Lead name is required"),
	leadEmail: z.string().email("Valid lead email is required"),
	leadPhone: z.string().optional(),
});

export async function POST(request: Request) {
	try {
		const adSecret = request.headers.get("x-ad-secret");
		const expectedSecret = process.env.AD_WEBHOOK_SECRET;

		if (process.env.NODE_ENV === "production") {
			if (!expectedSecret || adSecret !== expectedSecret) {
				return NextResponse.json(
					{ error: "Unauthorized: Invalid ad webhook secret" },
					{ status: 401 },
				);
			}
		} else if (expectedSecret && adSecret !== expectedSecret) {
			return NextResponse.json(
				{ error: "Unauthorized: Invalid ad webhook secret" },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const parseResult = adWebhookSchema.safeParse(body);
		if (!parseResult.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: parseResult.error.flatten().fieldErrors,
				},
				{ status: 400 },
			);
		}

		const { campaignId, leadName, leadEmail, leadPhone } = parseResult.data;

		const campaign = await db.query.adCampaigns.findFirst({
			where: eq(adCampaigns.id, campaignId),
		});

		if (!campaign) {
			return NextResponse.json(
				{ error: "Campaign not found" },
				{ status: 404 },
			);
		}

		const parts = leadName.trim().split(" ");
		const [newContact] = await db
			.insert(contacts)
			.values({
				organizationId: campaign.organizationId,
				firstName: parts[0] || leadName,
				lastName: parts.slice(1).join(" "),
				email: leadEmail,
				phone: leadPhone || null,
				source: "AD_CAMPAIGN",
				adCampaignId: campaign.id,
			})
			.returning();

		// Increment conversions on campaign
		await db
			.update(adCampaigns)
			.set({ conversions: (campaign.conversions || 0) + 1 })
			.where(eq(adCampaigns.id, campaign.id));

		return NextResponse.json({ success: true, contactId: newContact.id });
	} catch (error) {
		console.error("Ad webhook error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
