// @ts-nocheck
// no dotenv
const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);

async function run() {
	try {
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "title" varchar(255)`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "labels" jsonb`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "customFields" jsonb`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "showTotalInPdf" boolean DEFAULT true NOT NULL`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "showTotalInWords" boolean DEFAULT false NOT NULL`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "lineItems" jsonb`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "taxPercent" integer DEFAULT 0 NOT NULL`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "discountType" varchar(20) DEFAULT 'AMOUNT' NOT NULL`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "discountValue" integer DEFAULT 0 NOT NULL`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "additionalCharges" jsonb`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "signatureType" varchar(50) DEFAULT 'IMAGE' NOT NULL`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "signatureName" varchar(255)`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "signatureData" text`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "notes" text`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "attachments" jsonb`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "terms" jsonb`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "contactEmail" varchar(255)`,
		);
		await sql.unsafe(
			`ALTER TABLE "devcrm_invoice" ADD COLUMN IF NOT EXISTS "contactPhone" varchar(50)`,
		);
		console.log("Done DB Schema Alterations 2");
	} catch (e) {
		console.error(e);
	} finally {
		process.exit(0);
	}
}
run();
