import { sql } from "drizzle-orm";
import { db } from "~/server/db";

async function main() {
	console.log("Running Phase 16 manual migration...");
	try {
		// 1. Add PROFORMA to enum. This cannot be executed inside a transaction block in Postgres
		console.log("Adding PROFORMA to devcrm_invoice_status enum...");
		try {
			await db.execute(
				sql`ALTER TYPE devcrm_invoice_status ADD VALUE 'PROFORMA';`,
			);
			console.log("Successfully added PROFORMA enum value.");
		} catch (e: any) {
			if (e.message.includes("already exists")) {
				console.log("PROFORMA enum value already exists, skipping.");
			} else {
				throw e;
			}
		}

		// 2. Add version columns to quotes and invoices
		console.log("Adding version columns...");

		try {
			await db.execute(
				sql`ALTER TABLE devcrm_quote ADD COLUMN version integer DEFAULT 1 NOT NULL;`,
			);
			console.log("Added version to devcrm_quote.");
		} catch (e: any) {
			if (
				e.message.includes("already exists") ||
				e.message.includes(
					'column "version" of relation "devcrm_quote" already exists',
				)
			) {
				console.log("Column version on devcrm_quote already exists, skipping.");
			} else {
				throw e;
			}
		}

		try {
			await db.execute(
				sql`ALTER TABLE devcrm_invoice ADD COLUMN version integer DEFAULT 1 NOT NULL;`,
			);
			console.log("Added version to devcrm_invoice.");
		} catch (e: any) {
			if (
				e.message.includes("already exists") ||
				e.message.includes(
					'column "version" of relation "devcrm_invoice" already exists',
				)
			) {
				console.log(
					"Column version on devcrm_invoice already exists, skipping.",
				);
			} else {
				throw e;
			}
		}

		console.log("Migration completed successfully.");
		process.exit(0);
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}
}

main();
