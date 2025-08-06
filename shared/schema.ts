import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopifyDomain: text("shopify_domain").notNull().unique(),
  storeName: text("store_name").notNull(),
  email: text("email").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bugs = pgTable("bugs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // 'critical', 'warning', 'info'
  type: text("type").notNull(), // 'broken_link', 'js_error', 'performance', 'missing_image'
  url: text("url"),
  status: text("status").default('open'), // 'open', 'resolved', 'ignored'
  details: jsonb("details"), // Additional details like affected pages, specific errors, etc.
  detectedAt: timestamp("detected_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const scans = pgTable("scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id).notNull(),
  type: text("type").notNull(), // 'full_site', 'performance', 'link_validation'
  status: text("status").notNull(), // 'running', 'completed', 'failed'
  pagesScanned: integer("pages_scanned").default(0),
  duration: integer("duration_seconds"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id).notNull(),
  lcp: decimal("lcp", { precision: 5, scale: 2 }), // Largest Contentful Paint
  fcp: decimal("fcp", { precision: 5, scale: 2 }), // First Contentful Paint
  cls: decimal("cls", { precision: 5, scale: 3 }), // Cumulative Layout Shift
  overallScore: integer("overall_score"),
  // Lighthouse category scores for weighted store health calculation
  performanceScore: integer("performance_score"), // Performance category (0-100)
  accessibilityScore: integer("accessibility_score"), // Accessibility category (0-100)
  bestPracticesScore: integer("best_practices_score"), // Best Practices category (0-100)
  seoScore: integer("seo_score"), // SEO category (0-100)
  pwaScore: integer("pwa_score"), // Progressive Web App category (0-100)
  measuredAt: timestamp("measured_at").defaultNow(),
});

export const alertSettings = pgTable("alert_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id).notNull(),
  emailEnabled: boolean("email_enabled").default(true),
  slackEnabled: boolean("slack_enabled").default(false),
  emailAddress: text("email_address"),
  slackWebhook: text("slack_webhook"),
  slackBotToken: text("slack_bot_token"),
  slackChannelId: text("slack_channel_id"),
  scanFrequency: integer("scan_frequency").default(60),
  alertFrequency: text("alert_frequency").default('immediate'), // 'immediate', '5min', '15min', '30min', '1hour', 'daily'
  slackWebhookUrl: text("slack_webhook_url"),
  criticalThreshold: text("critical_threshold").default('immediate'),
  performanceThreshold: integer("performance_threshold").default(20), // percentage
  uptimeThreshold: integer("uptime_threshold").default(5), // minutes
  responseTimeThreshold: integer("response_time_threshold").default(2000), // milliseconds
  errorRateThreshold: integer("error_rate_threshold").default(5), // percentage
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id).notNull(),
  type: text("type").notNull(), // 'critical', 'warning', 'info'
  title: text("title").notNull(),
  message: text("message").notNull(),
  status: text("status").default('active'), // 'active', 'acknowledged', 'resolved'
  source: text("source").notNull(), // 'scan', 'uptime', 'performance', 'manual'
  metadata: jsonb("metadata"), // Additional data like URLs, error codes, etc.
  createdAt: timestamp("created_at").defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
});

// New tables for missing features
export const uptimeMonitoring = pgTable("uptime_monitoring", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id).notNull(),
  status: text("status").notNull(), // 'up', 'down', 'degraded'
  responseTime: integer("response_time_ms"),
  statusCode: integer("status_code"),
  checkedAt: timestamp("checked_at").defaultNow(),
  downFrom: timestamp("down_from"),
  downUntil: timestamp("down_until"),
});

export const themeChanges = pgTable("theme_changes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id).notNull(),
  fileName: text("file_name").notNull(),
  changeType: text("change_type").notNull(), // 'modified', 'added', 'deleted'
  previousHash: text("previous_hash"),
  currentHash: text("current_hash"),
  detectedAt: timestamp("detected_at").defaultNow(),
});

export const appInstallations = pgTable("app_installations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id).notNull(),
  appName: text("app_name").notNull(),
  appId: text("app_id"),
  action: text("action").notNull(), // 'installed', 'uninstalled', 'updated'
  version: text("version"),
  detectedAt: timestamp("detected_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id).notNull(),
  planType: text("plan_type").notNull(), // 'free', 'basic', 'pro', 'enterprise'
  status: text("status").notNull(), // 'active', 'cancelled', 'expired', 'trialing'
  monthlyRevenue: decimal("monthly_revenue", { precision: 10, scale: 2 }),
  billingCycle: text("billing_cycle").default('monthly'), // 'monthly', 'yearly'
  trialEndsAt: timestamp("trial_ends_at"),
  nextBillingAt: timestamp("next_billing_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const storesRelations = relations(stores, ({ many }) => ({
  bugs: many(bugs),
  scans: many(scans),
  performanceMetrics: many(performanceMetrics),
  alertSettings: many(alertSettings),
  alerts: many(alerts),
  uptimeMonitoring: many(uptimeMonitoring),
  themeChanges: many(themeChanges),
  appInstallations: many(appInstallations),
  subscriptions: many(subscriptions),
}));

export const bugsRelations = relations(bugs, ({ one }) => ({
  store: one(stores, {
    fields: [bugs.storeId],
    references: [stores.id],
  }),
}));

export const scansRelations = relations(scans, ({ one }) => ({
  store: one(stores, {
    fields: [scans.storeId],
    references: [stores.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  store: one(stores, {
    fields: [performanceMetrics.storeId],
    references: [stores.id],
  }),
}));

export const alertSettingsRelations = relations(alertSettings, ({ one }) => ({
  store: one(stores, {
    fields: [alertSettings.storeId],
    references: [stores.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  store: one(stores, {
    fields: [alerts.storeId],
    references: [stores.id],
  }),
}));

export const uptimeMonitoringRelations = relations(uptimeMonitoring, ({ one }) => ({
  store: one(stores, {
    fields: [uptimeMonitoring.storeId],
    references: [stores.id],
  }),
}));

export const themeChangesRelations = relations(themeChanges, ({ one }) => ({
  store: one(stores, {
    fields: [themeChanges.storeId],
    references: [stores.id],
  }),
}));

export const appInstallationsRelations = relations(appInstallations, ({ one }) => ({
  store: one(stores, {
    fields: [appInstallations.storeId],
    references: [stores.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  store: one(stores, {
    fields: [subscriptions.storeId],
    references: [stores.id],
  }),
}));

// Schemas
export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBugSchema = createInsertSchema(bugs).omit({
  id: true,
  detectedAt: true,
  resolvedAt: true,
});

export const insertScanSchema = createInsertSchema(scans).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  measuredAt: true,
});

export const insertAlertSettingsSchema = createInsertSchema(alertSettings).omit({
  id: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  acknowledgedAt: true,
  resolvedAt: true,
});

export const insertUptimeMonitoringSchema = createInsertSchema(uptimeMonitoring).omit({
  id: true,
  checkedAt: true,
});

export const insertThemeChangesSchema = createInsertSchema(themeChanges).omit({
  id: true,
  detectedAt: true,
});

export const insertAppInstallationsSchema = createInsertSchema(appInstallations).omit({
  id: true,
  detectedAt: true,
});

export const insertSubscriptionsSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type Bug = typeof bugs.$inferSelect;
export type InsertBug = z.infer<typeof insertBugSchema>;

export type Scan = typeof scans.$inferSelect;
export type InsertScan = z.infer<typeof insertScanSchema>;

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;

export type AlertSetting = typeof alertSettings.$inferSelect;
export type InsertAlertSetting = z.infer<typeof insertAlertSettingsSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type UptimeMonitoring = typeof uptimeMonitoring.$inferSelect;
export type InsertUptimeMonitoring = z.infer<typeof insertUptimeMonitoringSchema>;

export type ThemeChange = typeof themeChanges.$inferSelect;
export type InsertThemeChange = z.infer<typeof insertThemeChangesSchema>;

export type AppInstallation = typeof appInstallations.$inferSelect;
export type InsertAppInstallation = z.infer<typeof insertAppInstallationsSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionsSchema>;
