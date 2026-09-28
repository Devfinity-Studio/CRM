CREATE TYPE "public"."devcrm_deal_status" AS ENUM('OPEN', 'WON', 'LOST');--> statement-breakpoint
ALTER TABLE "devcrm_deal" ADD COLUMN "contactId" varchar(255);--> statement-breakpoint
ALTER TABLE "devcrm_deal" ADD COLUMN "status" "devcrm_deal_status" DEFAULT 'OPEN' NOT NULL;--> statement-breakpoint
ALTER TABLE "devcrm_deal" ADD CONSTRAINT "devcrm_deal_contactId_devcrm_contact_id_fk" FOREIGN KEY ("contactId") REFERENCES "public"."devcrm_contact"("id") ON DELETE set null ON UPDATE no action;