import { sql } from "drizzle-orm";
import { db } from "../src/server/db";

async function main() {
	console.log("Running Phase 21 migrations...");

	try {
		console.log("Creating devcrm_client_subscription_status enum...");
		await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE devcrm_client_subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

		console.log("Creating devcrm_client_subscription_cycle enum...");
		await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE devcrm_client_subscription_cycle AS ENUM ('MONTHLY', 'YEARLY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

		console.log("Creating client_subscription table...");
		await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "devcrm_client_subscription" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "organizationId" varchar(255) NOT NULL REFERENCES "devcrm_organization"("id") ON DELETE CASCADE,
        "companyId" varchar(255) NOT NULL REFERENCES "devcrm_company"("id") ON DELETE CASCADE,
        "productId" varchar(255) NOT NULL REFERENCES "devcrm_product"("id"),
        "status" "devcrm_client_subscription_status" DEFAULT 'ACTIVE' NOT NULL,
        "billing_cycle" "devcrm_client_subscription_cycle" DEFAULT 'MONTHLY' NOT NULL,
        "price" integer NOT NULL,
        "startDate" timestamp with time zone NOT NULL,
        "nextRenewalDate" timestamp with time zone NOT NULL,
        "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp with time zone
      );
    `);

		console.log("Phase 21 migration completed successfully!");
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}
	process.exit(0);
}

main();
