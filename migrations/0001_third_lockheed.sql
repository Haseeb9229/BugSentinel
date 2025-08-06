CREATE TABLE "alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'active',
	"source" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"acknowledged_at" timestamp,
	"resolved_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "alert_settings" ADD COLUMN "response_time_threshold" integer DEFAULT 2000;--> statement-breakpoint
ALTER TABLE "alert_settings" ADD COLUMN "error_rate_threshold" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "bugs" ADD COLUMN "details" jsonb;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;