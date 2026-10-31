// @ts-nocheck
require("dotenv").config();
const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);

async function run() {
	try {
		await sql.unsafe(`DROP TABLE IF EXISTS "devcrm_contact" CASCADE`);
		await sql.unsafe(`
      CREATE TABLE "devcrm_contact" (
        "id" character varying(255) PRIMARY KEY NOT NULL,
        "organizationId" character varying(255) NOT NULL,
        "companyId" character varying(255),
        "uid" character varying(100),
        "avatarUrl" text,
        "salutation" character varying(20),
        "firstName" character varying(100) NOT NULL,
        "lastName" character varying(100),
        "email" character varying(255),
        "phone" character varying(50),
        "additionalEmails" jsonb DEFAULT '[]'::jsonb,
        "additionalPhones" jsonb DEFAULT '[]'::jsonb,
        "pan" character varying(50),
        "aadhaar" character varying(50),
        "passport" character varying(50),
        "socialLinks" jsonb DEFAULT '{}'::jsonb,
        "addressCountry" character varying(100),
        "addressState" character varying(100),
        "addressDistrict" character varying(100),
        "addressCity" character varying(100),
        "addressBuilding" character varying(255),
        "addressStreet" text,
        "addressZip" character varying(20),
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        "updatedAt" timestamp with time zone
      );
    `);

		// Add foreign key constraints
		await sql.unsafe(`
      ALTER TABLE "devcrm_contact" 
      ADD CONSTRAINT devcrm_contact_organizationId_fkey 
      FOREIGN KEY ("organizationId") REFERENCES "devcrm_organization"("id") ON DELETE CASCADE;
    `);

		await sql.unsafe(`
      ALTER TABLE "devcrm_contact" 
      ADD CONSTRAINT devcrm_contact_companyId_fkey 
      FOREIGN KEY ("companyId") REFERENCES "devcrm_company"("id") ON DELETE SET NULL;
    `);

		console.log("Created devcrm_contact successfully");
	} catch (e) {
		console.error(e);
	} finally {
		process.exit(0);
	}
}
run();
