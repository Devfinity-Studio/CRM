import { sql } from "drizzle-orm";
import { db } from "../src/server/db";

async function main() {
	console.log("Running Phase 23 migrations...");

	try {
		console.log("Creating devcrm_automation_trigger enum...");
		await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE devcrm_automation_trigger AS ENUM ('INVOICE_DUE', 'SUBSCRIPTION_RENEWAL', 'DEAL_STALLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

		console.log("Creating devcrm_automation_action enum...");
		await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE devcrm_automation_action AS ENUM ('CREATE_NOTIFICATION', 'CREATE_TASK');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

		console.log("Creating automation_rule table...");
		await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "devcrm_automation_rule" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "organizationId" varchar(255) NOT NULL REFERENCES "devcrm_organization"("id") ON DELETE CASCADE,
        "name" varchar(255) NOT NULL,
        "trigger_type" "devcrm_automation_trigger" NOT NULL,
        "daysOffset" integer DEFAULT 0 NOT NULL,
        "action_type" "devcrm_automation_action" NOT NULL,
        "isActive" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp with time zone
      );
    `);

		console.log("Phase 23 migration completed successfully!");
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}
	process.exit(0);
}

main();
