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
  }

  async scheduleStoreScan(storeId: string) {
    try {
      // Get store's scan frequency setting
      const settings = await storage.getAlertSettings(storeId);
      const scanFrequencyMinutes = settings?.scanFrequency || 60; // Default to 1 hour

      // Calculate next scan time
      const now = new Date();
      const nextScanTime = new Date(now.getTime() + scanFrequencyMinutes * 60000);

      // Store the scheduled scan
      this.scheduledScans.set(storeId, {
        storeId,
        nextScanTime
      });
    } catch (error) {
      console.error(`Failed to schedule scan for store ${storeId}:`, error);
    }
  }

  async updateStoreScanSchedule(storeId: string) {
    // Remove existing schedule
    const existingScan = this.scheduledScans.get(storeId);
    if (existingScan) {
      this.scheduledScans.delete(storeId);
    }
    
    // Create new schedule with updated frequency
    await this.scheduleStoreScan(storeId);
  }

  private async checkAndRunScheduledScans() {
    const now = new Date();
    
    for (const [storeId, scheduledScan] of Array.from(this.scheduledScans.entries())) {
      // Check if scan is due
      if (now >= scheduledScan.nextScanTime) {
        // Schedule next scan BEFORE starting current scan (prevents race conditions)
        await this.scheduleStoreScan(storeId);
        
        try {
          // Get store info
          const store = await storage.getStore(storeId);
          if (!store) {
            console.error(`Store not found: ${storeId}`);
            continue; // Skip this scan and continue with others
          }

          // Check if test mode is enabled
          const { serverConfig } = await import('../config/environments');
          const actualUrl = serverConfig.testMode ? serverConfig.testWebsite : `https://${store.shopifyDomain}`;
          
          try {
            // Create ONE scan record - the engine will handle device types internally
            const scanData = {
              storeId,
              type: 'full_site' as const,
              status: 'running' as const,
              startedAt: new Date()
            };
            
            const scan = await storage.createScan(scanData);

            const scanRequest = {
              storeId,
              scanType: 'full_site' as const,
              url: actualUrl,
              scanId: scan.id
            };

            // Execute scan - engine will automatically run for both mobile and desktop
            await scanEngine.executeScan(scanRequest);
          } catch (scanError: any) {
            console.error(`HYBRID scan failed for store ${storeId}:`, scanError.message);
          }
        } catch (error) {
          console.error(`Failed to run scheduled scan for store ${storeId}:`, error);
        }
      }
    }
  }

  async stop() {
    this.isRunning = false;
    this.scheduledScans.clear();
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