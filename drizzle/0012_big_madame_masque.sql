CREATE TYPE "public"."devcrm_qualification_status" AS ENUM('NONE', 'MQL', 'SQL', 'DISQUALIFIED');--> statement-breakpoint
ALTER TABLE "devcrm_contact" ADD COLUMN "leadScore" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "devcrm_contact" ADD COLUMN "qualification_status" "devcrm_qualification_status" DEFAULT 'NONE' NOT NULL;