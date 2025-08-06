CREATE TABLE "alert_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar NOT NULL,
	"email_enabled" boolean DEFAULT true,
	"slack_enabled" boolean DEFAULT false,
	"email_address" text,
	"slack_webhook" text,
	"slack_bot_token" text,
	"slack_channel_id" text,
	"scan_frequency" integer DEFAULT 60,
	"alert_frequency" text DEFAULT 'immediate',
	"slack_webhook_url" text,
	"critical_threshold" text DEFAULT 'immediate',
	"performance_threshold" integer DEFAULT 20,
	"uptime_threshold" integer DEFAULT 5
);
--> statement-breakpoint
CREATE TABLE "app_installations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar NOT NULL,
	"app_name" text NOT NULL,
	"app_id" text,
	"action" text NOT NULL,
	"version" text,
	"detected_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bugs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" text NOT NULL,
	"type" text NOT NULL,
	"url" text,
	"status" text DEFAULT 'open',
	"detected_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "performance_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar NOT NULL,
	"lcp" numeric(5, 2),
	"fcp" numeric(5, 2),
	"cls" numeric(5, 3),
	"overall_score" integer,
	"measured_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"pages_scanned" integer DEFAULT 0,
	"duration_seconds" integer,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shopify_domain" text NOT NULL,
	"store_name" text NOT NULL,
	"email" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "stores_shopify_domain_unique" UNIQUE("shopify_domain")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar NOT NULL,
	"plan_type" text NOT NULL,
	"status" text NOT NULL,
	"monthly_revenue" numeric(10, 2),
	"billing_cycle" text DEFAULT 'monthly',
	"trial_ends_at" timestamp,
	"next_billing_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "theme_changes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"change_type" text NOT NULL,
	"previous_hash" text,
	"current_hash" text,
	"detected_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "uptime_monitoring" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar NOT NULL,
	"status" text NOT NULL,
	"response_time_ms" integer,
	"status_code" integer,
	"checked_at" timestamp DEFAULT now(),
	"down_from" timestamp,
	"down_until" timestamp
);
--> statement-breakpoint
ALTER TABLE "alert_settings" ADD CONSTRAINT "alert_settings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_installations" ADD CONSTRAINT "app_installations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bugs" ADD CONSTRAINT "bugs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_changes" ADD CONSTRAINT "theme_changes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uptime_monitoring" ADD CONSTRAINT "uptime_monitoring_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;