ALTER TABLE "devcrm_activity_note" ADD COLUMN "dealId" varchar(255);--> statement-breakpoint
ALTER TABLE "devcrm_activity_note" ADD COLUMN "contactId" varchar(255);--> statement-breakpoint
ALTER TABLE "devcrm_user" ADD COLUMN "hasSeenWelcome" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "devcrm_activity_note" ADD CONSTRAINT "devcrm_activity_note_dealId_devcrm_deal_id_fk" FOREIGN KEY ("dealId") REFERENCES "public"."devcrm_deal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devcrm_activity_note" ADD CONSTRAINT "devcrm_activity_note_contactId_devcrm_contact_id_fk" FOREIGN KEY ("contactId") REFERENCES "public"."devcrm_contact"("id") ON DELETE cascade ON UPDATE no action;