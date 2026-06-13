ALTER TABLE "cards" ADD COLUMN "interval_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "ease" integer DEFAULT 2500 NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "reps" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "lapses" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "first_reviewed_at" date;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "suspended_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "cards_deck_id_due_date_idx" ON "cards" USING btree ("deck_id","due_date");