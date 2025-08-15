import {
  stores, bugs, scans, performanceMetrics, alertSettings, alerts, themeChanges,
  appInstallations, subscriptions, uptimeMonitoring
} from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import type {
  Store, InsertStore,
  Bug, InsertBug,
  Scan, InsertScan,
  PerformanceMetric, InsertPerformanceMetric,
  AlertSetting, InsertAlertSetting,
  Alert, InsertAlert,
  UptimeMonitoring, InsertUptimeMonitoring,
  ThemeChange, InsertThemeChange,
  AppInstallation, InsertAppInstallation,
  Subscription, InsertSubscription
} from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  // Stores
  getStore(id: string): Promise<Store | undefined>;
  getStoreByDomain(domain: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: string, updates: Partial<InsertStore>): Promise<Store>;
  getAllStores(): Promise<Store[]>;

  // Bugs
  getBugsByStoreId(storeId: string): Promise<Bug[]>;
  getBugsByStoreIdAndDevice(storeId: string, deviceType: string): Promise<Bug[]>;
  getAllBugs(): Promise<Bug[]>;
  getBugById(bugId: string): Promise<Bug | undefined>;
  createBug(bug: InsertBug): Promise<Bug>;
  updateBugStatus(bugId: string, status: string): Promise<Bug | undefined>;

  // Scans
  getScansByStoreId(storeId: string): Promise<Scan[]>;
  getAllScans(): Promise<Scan[]>;
  getScanById(scanId: string): Promise<Scan | undefined>;
  createScan(scan: InsertScan): Promise<Scan>;
  updateScan(scanId: string, updates: Partial<Scan>): Promise<Scan | undefined>;

  // Performance Metrics
  getLatestPerformanceMetrics(storeId: string): Promise<PerformanceMetric | undefined>;
  getLatestPerformanceMetricsByDevice(storeId: string, deviceType: string): Promise<PerformanceMetric | undefined>;
  getPerformanceMetricsByStore(storeId: string): Promise<PerformanceMetric[]>;
  getPerformanceMetricsByStoreAndDevice(storeId: string, deviceType: string): Promise<PerformanceMetric[]>;
  getAllPerformanceMetrics(): Promise<PerformanceMetric[]>;
  createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric>;

  // Alert Settings
  getAlertSettings(storeId: string): Promise<AlertSetting | undefined>;
  updateAlertSettings(storeId: string, settings: Partial<InsertAlertSetting>): Promise<AlertSetting>;

  // Alerts
  getAlertsByStoreId(storeId: string): Promise<Alert[]>;
  getAllAlerts(): Promise<Alert[]>;
  getAlertById(alertId: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlertStatus(alertId: string, status: string): Promise<Alert | undefined>;

  // Uptime Monitoring
  getUptimeMonitoringByStoreId(storeId: string): Promise<UptimeMonitoring[]>;
  getLatestUptimeStatus(storeId: string): Promise<UptimeMonitoring | undefined>;
  createUptimeCheck(uptimeCheck: InsertUptimeMonitoring): Promise<UptimeMonitoring>;

  // Theme Changes
  getThemeChangesByStoreId(storeId: string): Promise<ThemeChange[]>;
  createThemeChange(themeChange: InsertThemeChange): Promise<ThemeChange>;

  // App Installations
  getAppInstallationsByStoreId(storeId: string): Promise<AppInstallation[]>;
  createAppInstallation(appInstallation: InsertAppInstallation): Promise<AppInstallation>;
}

export class DatabaseStorage implements IStorage {
  // Stores
  async getStore(id: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store || undefined;
  }

  async getStoreByDomain(domain: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.shopifyDomain, domain));
    return store || undefined;
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const [store] = await db
      .insert(stores)
      .values(insertStore)
      .returning();
    return store;
  }

  async updateStore(id: string, updates: Partial<InsertStore>): Promise<Store> {
    const [store] = await db
      .update(stores)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stores.id, id))
      .returning();
    return store;
  }

  async getAllStores(): Promise<Store[]> {
    return await db
      .select()
      .from(stores)
      .orderBy(desc(stores.createdAt));
  }

  // Bugs
  async getBugsByStoreId(storeId: string): Promise<Bug[]> {
    const result = await db
      .select()
      .from(bugs)
      .where(eq(bugs.storeId, storeId))
      .orderBy(desc(bugs.detectedAt));
    return result;
  }

  async getBugsByStoreIdAndDevice(storeId: string, deviceType: string): Promise<Bug[]> {
    const result = await db
      .select()
      .from(bugs)
      .where(and(eq(bugs.storeId, storeId), eq(bugs.deviceType, deviceType)))
      .orderBy(desc(bugs.detectedAt));
    return result;
  }

  async getAllBugs(): Promise<Bug[]> {
    const result = await db
      .select()
      .from(bugs)
      .orderBy(desc(bugs.detectedAt));
    return result;
  }

  async getBugById(bugId: string): Promise<Bug | undefined> {
    const [bug] = await db.select().from(bugs).where(eq(bugs.id, bugId));
    return bug || undefined;
  }

  async createBug(insertBug: InsertBug): Promise<Bug> {
    const [bug] = await db
      .insert(bugs)
      .values(insertBug)
      .returning();
    return bug;
  }

  async updateBugStatus(bugId: string, status: string): Promise<Bug | undefined> {
    const [bug] = await db
      .update(bugs)
      .set({ status, resolvedAt: status === 'resolved' ? new Date() : null })
      .where(eq(bugs.id, bugId))
      .returning();
    return bug || undefined;
  }

  // Scans
  async getScansByStoreId(storeId: string): Promise<Scan[]> {
    return await db
      .select()
      .from(scans)
      .where(eq(scans.storeId, storeId))
      .orderBy(desc(scans.startedAt))
      .limit(10);
  }

  async getAllScans(): Promise<Scan[]> {
    return await db
      .select()
      .from(scans)
      .orderBy(desc(scans.startedAt));
  }

  async getScanById(scanId: string): Promise<Scan | undefined> {
    const [scan] = await db
      .select()
      .from(scans)
      .where(eq(scans.id, scanId));
    return scan || undefined;
  }

  async createScan(insertScan: InsertScan): Promise<Scan> {
    const [scan] = await db
      .insert(scans)
      .values(insertScan)
      .returning();
    return scan;
  }

  async updateScan(scanId: string, updates: Partial<Scan>): Promise<Scan | undefined> {
    const [scan] = await db
      .update(scans)
      .set(updates)
      .where(eq(scans.id, scanId))
      .returning();
    return scan || undefined;
  }

  // Performance Metrics
  async getLatestPerformanceMetrics(storeId: string): Promise<PerformanceMetric | undefined> {
    const [metric] = await db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.storeId, storeId))
      .orderBy(desc(performanceMetrics.measuredAt))
      .limit(1);
    return metric || undefined;
  }

  async getLatestPerformanceMetricsByDevice(storeId: string, deviceType: string): Promise<PerformanceMetric | undefined> {
    const [metric] = await db
      .select()
      .from(performanceMetrics)
      .where(and(eq(performanceMetrics.storeId, storeId), eq(performanceMetrics.deviceType, deviceType)))
      .orderBy(desc(performanceMetrics.measuredAt))
      .limit(1);
    return metric || undefined;
  }

  async createPerformanceMetric(insertMetric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const [metric] = await db
      .insert(performanceMetrics)
      .values(insertMetric)
      .returning();
    return metric;
  }

  async getPerformanceMetricsByStore(storeId: string): Promise<PerformanceMetric[]> {
    return await db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.storeId, storeId))
      .orderBy(desc(performanceMetrics.measuredAt));
  }

  async getPerformanceMetricsByStoreAndDevice(storeId: string, deviceType: string): Promise<PerformanceMetric[]> {
    return await db
      .select()
      .from(performanceMetrics)
      .where(and(eq(performanceMetrics.storeId, storeId), eq(performanceMetrics.deviceType, deviceType)))
      .orderBy(desc(performanceMetrics.measuredAt));
  }

  async getAllPerformanceMetrics(): Promise<PerformanceMetric[]> {
    return await db
      .select()
      .from(performanceMetrics)
      .orderBy(desc(performanceMetrics.measuredAt));
  }

  // Alert Settings
  async getAlertSettings(storeId: string): Promise<AlertSetting | undefined> {
    const [settings] = await db
      .select()
      .from(alertSettings)
      .where(eq(alertSettings.storeId, storeId));
    return settings || undefined;
  }

  async updateAlertSettings(storeId: string, settingsUpdate: Partial<InsertAlertSetting>): Promise<AlertSetting> {
    const existingSettings = await this.getAlertSettings(storeId);

    if (existingSettings) {
      const [settings] = await db
        .update(alertSettings)
        .set(settingsUpdate)
        .where(eq(alertSettings.storeId, storeId))
        .returning();
      return settings;
    } else {
      const [settings] = await db
        .insert(alertSettings)
        .values({ storeId, ...settingsUpdate })
        .returning();
      return settings;
    }
  }

  // Alerts
  async getAlertsByStoreId(storeId: string): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.storeId, storeId))
      .orderBy(desc(alerts.createdAt));
  }



  async getAllAlerts(): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .orderBy(desc(alerts.createdAt));
  }

  async getAlertById(alertId: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, alertId));
    return alert || undefined;
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [alert] = await db
      .insert(alerts)
      .values(insertAlert)
      .returning();
    return alert;
  }

  async updateAlertStatus(alertId: string, status: string): Promise<Alert | undefined> {
    const [alert] = await db
      .update(alerts)
      .set({ status, resolvedAt: status === 'resolved' ? new Date() : null })
      .where(eq(alerts.id, alertId))
      .returning();
    return alert || undefined;
  }

  // Uptime Monitoring
  async getUptimeMonitoringByStoreId(storeId: string): Promise<UptimeMonitoring[]> {
    return await db
      .select()
      .from(uptimeMonitoring)
      .where(eq(uptimeMonitoring.storeId, storeId))
      .orderBy(desc(uptimeMonitoring.checkedAt));
  }

  async getLatestUptimeStatus(storeId: string): Promise<UptimeMonitoring | undefined> {
    const [status] = await db
      .select()
      .from(uptimeMonitoring)
      .where(eq(uptimeMonitoring.storeId, storeId))
      .orderBy(desc(uptimeMonitoring.checkedAt))
      .limit(1);
    return status || undefined;
  }

  async createUptimeCheck(uptimeCheck: InsertUptimeMonitoring): Promise<UptimeMonitoring> {
    const [status] = await db
      .insert(uptimeMonitoring)
      .values(uptimeCheck)
      .returning();
    return status;
  }

  // Theme Changes
  async getThemeChangesByStoreId(storeId: string): Promise<ThemeChange[]> {
    return await db
      .select()
      .from(themeChanges)
      .where(eq(themeChanges.storeId, storeId))
      .orderBy(desc(themeChanges.detectedAt));
  }

  async createThemeChange(insertThemeChange: InsertThemeChange): Promise<ThemeChange> {
    const [themeChange] = await db
      .insert(themeChanges)
      .values(insertThemeChange)
      .returning();
    return themeChange;
  }

  // App Installations
  async getAppInstallationsByStoreId(storeId: string): Promise<AppInstallation[]> {
    return await db
      .select()
      .from(appInstallations)
      .where(eq(appInstallations.storeId, storeId))
      .orderBy(desc(appInstallations.detectedAt));
  }

  async createAppInstallation(appInstallation: InsertAppInstallation): Promise<AppInstallation> {
    const [installation] = await db
      .insert(appInstallations)
      .values(appInstallation)
      .returning();
    return installation;
  }
}

export const storage = new DatabaseStorage();
