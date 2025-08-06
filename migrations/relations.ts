import { relations } from "drizzle-orm/relations";
import { stores, appInstallations, bugs, alertSettings, performanceMetrics, scans, subscriptions, themeChanges, uptimeMonitoring, alerts } from "./schema";

export const appInstallationsRelations = relations(appInstallations, ({one}) => ({
	store: one(stores, {
		fields: [appInstallations.storeId],
		references: [stores.id]
	}),
}));

export const storesRelations = relations(stores, ({many}) => ({
	appInstallations: many(appInstallations),
	bugs: many(bugs),
	alertSettings: many(alertSettings),
	performanceMetrics: many(performanceMetrics),
	scans: many(scans),
	subscriptions: many(subscriptions),
	themeChanges: many(themeChanges),
	uptimeMonitorings: many(uptimeMonitoring),
	alerts: many(alerts),
}));

export const bugsRelations = relations(bugs, ({one}) => ({
	store: one(stores, {
		fields: [bugs.storeId],
		references: [stores.id]
	}),
}));

export const alertSettingsRelations = relations(alertSettings, ({one}) => ({
	store: one(stores, {
		fields: [alertSettings.storeId],
		references: [stores.id]
	}),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({one}) => ({
	store: one(stores, {
		fields: [performanceMetrics.storeId],
		references: [stores.id]
	}),
}));

export const scansRelations = relations(scans, ({one}) => ({
	store: one(stores, {
		fields: [scans.storeId],
		references: [stores.id]
	}),
}));

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	store: one(stores, {
		fields: [subscriptions.storeId],
		references: [stores.id]
	}),
}));

export const themeChangesRelations = relations(themeChanges, ({one}) => ({
	store: one(stores, {
		fields: [themeChanges.storeId],
		references: [stores.id]
	}),
}));

export const uptimeMonitoringRelations = relations(uptimeMonitoring, ({one}) => ({
	store: one(stores, {
		fields: [uptimeMonitoring.storeId],
		references: [stores.id]
	}),
}));

export const alertsRelations = relations(alerts, ({one}) => ({
	store: one(stores, {
		fields: [alerts.storeId],
		references: [stores.id]
	}),
}));