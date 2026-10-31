import { sql } from "drizzle-orm";
import { db } from "~/server/db";

async function main() {
	console.log("Running Phase 18 manual migration...");
	try {
		// 1. Add amountPaid and balanceDue to invoices
		console.log("Adding amountPaid and balanceDue to devcrm_invoice...");
		try {
			await db.execute(
				sql`ALTER TABLE devcrm_invoice ADD COLUMN "amountPaid" integer DEFAULT 0 NOT NULL;`,
			);
			console.log("Added amountPaid.");
		} catch (e: any) {
			if (e.message.includes("already exists")) {
				console.log("Column amountPaid already exists, skipping.");
			} else {
				throw e;
			}
		}

		try {
			// For existing invoices, set balanceDue = totalAmount to start with
			await db.execute(
				sql`ALTER TABLE devcrm_invoice ADD COLUMN "balanceDue" integer;`,
			);
			await db.execute(
				sql`UPDATE devcrm_invoice SET "balanceDue" = "totalAmount";`,
			);
			await db.execute(
				sql`ALTER TABLE devcrm_invoice ALTER COLUMN "balanceDue" SET NOT NULL;`,
			);
			console.log("Added balanceDue.");
		} catch (e: any) {
			if (e.message.includes("already exists")) {
				console.log("Column balanceDue already exists, skipping.");
			} else {
				throw e;
			}
		}

		// 2. Create payments table
		console.log("Creating devcrm_payment table...");
		try {
			await db.execute(sql`
        CREATE TABLE IF NOT EXISTS devcrm_payment (
          id varchar(255) PRIMARY KEY NOT NULL,
          "organizationId" varchar(255) NOT NULL REFERENCES devcrm_organization(id) ON DELETE CASCADE,
          "invoiceId" varchar(255) NOT NULL REFERENCES devcrm_invoice(id) ON DELETE CASCADE,
          amount integer NOT NULL,
          "paymentDate" timestamp with time zone NOT NULL,
          "paymentMethod" varchar(50) NOT NULL,
          "referenceNumber" varchar(255),
          notes text,
          "createdAt" timestamp with time zone DEFAULT now() NOT NULL
        );
      `);
			console.log("Created devcrm_payment table.");
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
