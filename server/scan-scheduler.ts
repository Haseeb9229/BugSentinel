import { storage } from "./storage";
import { scanEngine } from "./scanning/scan-engine";

interface ScheduledScan {
  storeId: string;
  nextScanTime: Date;
  intervalId?: NodeJS.Timeout;
}

class ScanScheduler {
  private scheduledScans: Map<string, ScheduledScan> = new Map();
  private isRunning = false;

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("Starting scan scheduler...");

    // Load all stores and schedule their scans
    const stores = await storage.getAllStores();
    for (const store of stores) {
      if (store.isActive) {
        await this.scheduleStoreScan(store.id);
      }
    }

    // Check for new scans every minute
    setInterval(() => {
      this.checkAndRunScheduledScans();
    }, 60000); // 1 minute

    console.log("Scan scheduler started");
  }

  async scheduleStoreScan(storeId: string) {
    try {
      // Get store's scan frequency setting
      const settings = await storage.getAlertSettings(storeId);
      const scanFrequencyMinutes = settings?.scanFrequency || 60; // Default to 1 hour

      console.log(`📅 Scheduling scan for store ${storeId}:`, {
        scanFrequency: settings?.scanFrequency,
        emailEnabled: settings?.emailEnabled,
        slackEnabled: settings?.slackEnabled,
        usingDefault: !settings?.scanFrequency
      });

      // Calculate next scan time
      const now = new Date();
      const nextScanTime = new Date(now.getTime() + scanFrequencyMinutes * 60000);

      // Store the scheduled scan
      this.scheduledScans.set(storeId, {
        storeId,
        nextScanTime
      });

      console.log(`✅ Scheduled scan for store ${storeId} in ${scanFrequencyMinutes} minutes (${nextScanTime.toISOString()})`);
    } catch (error) {
      console.error(`❌ Failed to schedule scan for store ${storeId}:`, error);
    }
  }

  async updateStoreScanSchedule(storeId: string) {
    console.log(`🔄 Updating scan schedule for store ${storeId} due to frequency change`);
    
    // Remove existing schedule
    const existingScan = this.scheduledScans.get(storeId);
    if (existingScan) {
      console.log(`🗑️  Removing existing scan scheduled for ${existingScan.nextScanTime.toISOString()}`);
      this.scheduledScans.delete(storeId);
    }
    
    // Create new schedule with updated frequency
    await this.scheduleStoreScan(storeId);
  }

  private async checkAndRunScheduledScans() {
    const now = new Date();
    console.log(`🔍 Checking scheduled scans at ${now.toISOString()}`);
    console.log(`📋 Total scheduled scans: ${this.scheduledScans.size}`);
    
    for (const [storeId, scheduledScan] of this.scheduledScans.entries()) {
      console.log(`⏰ Store ${storeId}: next scan at ${scheduledScan.nextScanTime.toISOString()}, now: ${now.toISOString()}`);
      
      // Check if scan is due
      if (now >= scheduledScan.nextScanTime) {
        // Time to run the scan
        console.log(`Running scheduled scan for store ${storeId}`);
        
        // Schedule next scan BEFORE starting current scan (prevents race conditions)
        await this.scheduleStoreScan(storeId);
        
        try {
          // Get store info
          const store = await storage.getStore(storeId);
          if (!store) {
            console.error(`Store not found: ${storeId}`);
            continue; // Skip this scan and continue with others
          }

          // Create scan record in database first
          const scanData = {
            storeId,
            type: 'full_site' as const,
            status: 'running' as const,
            startedAt: new Date()
          };
          
          const scan = await storage.createScan(scanData);
          console.log(`Created scan record: ${scan.id}`);

          // Check if test mode is enabled
          const { serverConfig } = await import('../config/environments');
          const actualUrl = serverConfig.testMode ? serverConfig.testWebsite : `https://${store.shopifyDomain}`;
          
          if (serverConfig.testMode) {
            console.log(`🧪 TEST MODE: Scheduled scan will use test website: ${actualUrl}`);
          }

          // Create scan request
          const scanRequest = {
            storeId,
            scanType: 'full_site' as const,
            url: actualUrl,
            scanId: scan.id
          };

          // Run the scan
          await scanEngine.executeScan(scanRequest);
        } catch (error) {
          console.error(`Failed to run scheduled scan for store ${storeId}:`, error);
        }
      }
    }
    
    // Log if no scans were due
    if (this.scheduledScans.size === 0) {
      console.log(`📋 No scheduled scans found`);
    }
  }

  async stop() {
    this.isRunning = false;
    this.scheduledScans.clear();
    console.log("Scan scheduler stopped");
  }

  getScheduledScans() {
    return Array.from(this.scheduledScans.values());
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      scheduledScans: this.scheduledScans.size
    };
  }
}

export const scanScheduler = new ScanScheduler(); 