ALTER TYPE "public"."invitation_status" ADD VALUE 'draft' BEFORE 'pending';--> statement-breakpoint
ALTER TABLE "rfqs" ADD COLUMN "share_token" text DEFAULT gen_random_uuid()::text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "rfq_invitations_rfq_email_uniq" ON "rfq_invitations" USING btree ("rfq_id",lower("pg_email"));--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_share_token_unique" UNIQUE("share_token");