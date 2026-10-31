import { sql } from "drizzle-orm";
import { db } from "../src/server/db";

async function main() {
	console.log("Running migration 0011...");
	try {
		await db.execute(
			sql`ALTER TABLE devcrm_user ADD COLUMN "hasSeenWelcome" boolean DEFAULT false NOT NULL;`,
		);
		console.log("Migration 0011 successful!");
	} catch (err: any) {
		if (err.message?.includes("already exists")) {
			console.log("Column already exists, skipping...");
		} else {
			console.error("Migration failed", err);
		}
	}
	process.exit(0);
}

main();
