import { sql } from "drizzle-orm";
import { db } from "../src/server/db";

async function main() {
	try {
		await db.execute(
			sql`ALTER TABLE "devcrm_user_settings" ADD COLUMN IF NOT EXISTS "theme" varchar(50) DEFAULT 'light' NOT NULL;`,
		);
		console.log("Added theme column");
	} catch (e) {
		console.log("Theme column might already exist", e);
	}

	try {
		await db.execute(
			sql`ALTER TABLE "devcrm_user_settings" ADD COLUMN IF NOT EXISTS "locale" varchar(50) DEFAULT 'en-US' NOT NULL;`,
		);
		console.log("Added locale column");
	} catch (e) {
		console.log("Locale column might already exist", e);
	}

	process.exit(0);
}

main();
