-- rfq_invitations: source (request vs recommendation)
DO $$ BEGIN
  CREATE TYPE "public"."invitation_source" AS ENUM('request', 'recommendation');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

ALTER TABLE "rfq_invitations" ADD COLUMN IF NOT EXISTS "source" "invitation_source" NOT NULL DEFAULT 'request';--> statement-breakpoint
