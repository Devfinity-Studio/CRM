import { sql } from "drizzle-orm";
import { db } from "~/server/db";

async function main() {
	console.log("Running Phase 19 manual migration...");
	try {
		console.log("Creating devcrm_statement table...");
		try {
			await db.execute(sql`
        CREATE TABLE IF NOT EXISTS devcrm_statement (
          id varchar(255) PRIMARY KEY NOT NULL,
          "organizationId" varchar(255) NOT NULL REFERENCES devcrm_organization(id) ON DELETE CASCADE,
          "companyId" varchar(255) NOT NULL REFERENCES devcrm_company(id) ON DELETE CASCADE,
          "statementNumber" varchar(100) NOT NULL,
          "startDate" timestamp with time zone NOT NULL,
          "endDate" timestamp with time zone NOT NULL,
          "openingBalance" integer NOT NULL,
          "closingBalance" integer NOT NULL,
          transactions jsonb NOT NULL,
          "createdAt" timestamp with time zone DEFAULT now() NOT NULL
        );
      `);
			console.log("Created devcrm_statement table.");
		} catch (e: any) {
			throw e;
		}

		console.log("Migration completed successfully.");
		process.exit(0);
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}
}

main();
