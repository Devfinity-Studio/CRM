import { sql } from "drizzle-orm";
import { db } from "../src/server/db";

async function run() {
	await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "devcrm_global_settings" (
        "id" varchar(255) PRIMARY KEY DEFAULT 'default' NOT NULL,
        "maintenanceMode" boolean DEFAULT false NOT NULL,
        "enableBetaFeatures" boolean DEFAULT false NOT NULL,
        "updatedAt" timestamp with time zone
    );
  `);

	try {
		await db.execute(
			sql`ALTER TABLE "devcrm_organization" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;`,
		);
	} catch (e) {
		console.log("isActive already exists or error:", e);
	}

	console.log("Migration 0010 applied");
	process.exit(0);
}

run();
