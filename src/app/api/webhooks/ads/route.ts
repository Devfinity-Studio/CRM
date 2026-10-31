import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { adCampaigns, contacts } from "@/server/db/schema";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { campaignId, leadName, leadEmail, leadPhone } = body;

		if (!campaignId || !leadName || !leadEmail) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		const campaign = await db.query.adCampaigns.findFirst({
			where: eq(adCampaigns.id, campaignId),
		});

		if (!campaign) {
			return NextResponse.json(
				{ error: "Campaign not found" },
				{ status: 404 },
			);
		}

		const parts = leadName.split(" ");
		const [newContact] = await db
			.insert(contacts)
			.values({
				organizationId: campaign.organizationId,
				firstName: parts[0],
				lastName: parts.slice(1).join(" "),
				email: leadEmail,
				phone: leadPhone,
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
