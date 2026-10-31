import { sql } from "drizzle-orm";
import { db } from "../src/server/db";

async function main() {
	try {
		await db.execute(
			sql`ALTER TABLE "devcrm_contact" ADD COLUMN "adCampaignId" varchar(255);`,
		);
		await db.execute(
			sql`ALTER TABLE "devcrm_contact" ADD CONSTRAINT "devcrm_contact_adCampaignId_devcrm_ad_campaign_id_fk" FOREIGN KEY ("adCampaignId") REFERENCES "public"."devcrm_ad_campaign"("id") ON DELETE set null ON UPDATE no action;`,
		);
	} catch (e) {}

	try {
		await db.execute(
			sql`ALTER TABLE "devcrm_product" ADD COLUMN "isPublic" boolean DEFAULT false NOT NULL;`,
		);
	} catch (e) {}

	console.log("Migration 0009 pushed manually");
	process.exit(0);
}

main();
