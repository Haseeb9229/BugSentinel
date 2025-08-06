import { pgTable, foreignKey, varchar, text, timestamp, boolean, integer, unique, numeric, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const appInstallations = pgTable("app_installations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	storeId: varchar("store_id").notNull(),
	appName: text("app_name").notNull(),
	appId: text("app_id"),
	action: text().notNull(),
	version: text(),
	detectedAt: timestamp("detected_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "app_installations_store_id_stores_id_fk"
		}),
]);

export const bugs = pgTable("bugs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	storeId: varchar("store_id").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	severity: text().notNull(),
	type: text().notNull(),
	url: text(),
	status: text().default('open'),
	detectedAt: timestamp("detected_at", { mode: 'string' }).defaultNow(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "bugs_store_id_stores_id_fk"
		}),
]);

export const alertSettings = pgTable("alert_settings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	storeId: varchar("store_id").notNull(),
	emailEnabled: boolean("email_enabled").default(true),
	slackEnabled: boolean("slack_enabled").default(false),
	emailAddress: text("email_address"),
	slackWebhook: text("slack_webhook"),
	scanFrequency: integer("scan_frequency").default(60),
	slackWebhookUrl: text("slack_webhook_url"),
	criticalThreshold: text("critical_threshold").default('immediate'),
	performanceThreshold: integer("performance_threshold").default(20),
	uptimeThreshold: integer("uptime_threshold").default(5),
	slackBotToken: text("slack_bot_token"),
	slackChannelId: text("slack_channel_id"),
	alertFrequency: text("alert_frequency").default('immediate'),
	responseTimeThreshold: integer("response_time_threshold").default(2000),
	errorRateThreshold: integer("error_rate_threshold").default(5),
}, (table) => [
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "alert_settings_store_id_stores_id_fk"
		}),
]);

export const stores = pgTable("stores", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	shopifyDomain: text("shopify_domain").notNull(),
	storeName: text("store_name").notNull(),
	email: text().notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("stores_shopify_domain_unique").on(table.shopifyDomain),
]);

export const performanceMetrics = pgTable("performance_metrics", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	storeId: varchar("store_id").notNull(),
	lcp: numeric({ precision: 5, scale:  2 }),
	fcp: numeric({ precision: 5, scale:  2 }),
	cls: numeric({ precision: 5, scale:  3 }),
	overallScore: integer("overall_score"),
	measuredAt: timestamp("measured_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "performance_metrics_store_id_stores_id_fk"
		}),
]);

export const scans = pgTable("scans", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	storeId: varchar("store_id").notNull(),
	type: text().notNull(),
	status: text().notNull(),
	pagesScanned: integer("pages_scanned").default(0),
	durationSeconds: integer("duration_seconds"),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "scans_store_id_stores_id_fk"
		}),
]);

export const subscriptions = pgTable("subscriptions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	storeId: varchar("store_id").notNull(),
	planType: text("plan_type").notNull(),
	status: text().notNull(),
	monthlyRevenue: numeric("monthly_revenue", { precision: 10, scale:  2 }),
	billingCycle: text("billing_cycle").default('monthly'),
	trialEndsAt: timestamp("trial_ends_at", { mode: 'string' }),
	nextBillingAt: timestamp("next_billing_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "subscriptions_store_id_stores_id_fk"
		}),
]);

export const themeChanges = pgTable("theme_changes", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	storeId: varchar("store_id").notNull(),
	fileName: text("file_name").notNull(),
	changeType: text("change_type").notNull(),
	previousHash: text("previous_hash"),
	currentHash: text("current_hash"),
	detectedAt: timestamp("detected_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "theme_changes_store_id_stores_id_fk"
		}),
]);

export const uptimeMonitoring = pgTable("uptime_monitoring", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	storeId: varchar("store_id").notNull(),
	status: text().notNull(),
	responseTimeMs: integer("response_time_ms"),
	statusCode: integer("status_code"),
	checkedAt: timestamp("checked_at", { mode: 'string' }).defaultNow(),
	downFrom: timestamp("down_from", { mode: 'string' }),
	downUntil: timestamp("down_until", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "uptime_monitoring_store_id_stores_id_fk"
		}),
]);

export const alerts = pgTable("alerts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	storeId: varchar("store_id").notNull(),
	type: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	status: text().default('active'),
	source: text().notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	acknowledgedAt: timestamp("acknowledged_at", { mode: 'string' }),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "alerts_store_id_stores_id_fk"
		}),
]);
