import { sql } from "drizzle-orm";
import { db } from "../src/server/db";

async function main() {
	try {
		await db.execute(
			sql`ALTER TYPE "public"."devcrm_automation_action" ADD VALUE IF NOT EXISTS 'SEND_EMAIL';`,
		);
		await db.execute(
			sql`ALTER TYPE "public"."devcrm_automation_action" ADD VALUE IF NOT EXISTS 'INTERNAL_ALERT';`,
		);
		await db.execute(
			sql`ALTER TYPE "public"."devcrm_automation_trigger" ADD VALUE IF NOT EXISTS 'QUOTE_SENT';`,
		);
		console.log("Enums updated successfully");
	} catch (e) {
		console.error(e);
	}
	process.exit(0);
}

main();
