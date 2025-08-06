import * as cron from 'node-cron';
import { storage } from '../storage';
import { scanEngine } from './scan-engine';
import { v4 as uuidv4 } from 'uuid';

export class ScanScheduler {
  private jobs = new Map<string, cron.ScheduledTask>();
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log('Scan scheduler already running');
      return;
    }

    console.log('Starting scan scheduler...');
    this.isRunning = true;

    // Main scheduler - runs every 15 minutes to check for due scans
    const mainJob = cron.schedule('*/15 * * * *', async () => {
      await this.checkAndRunScheduledScans();
    }, {
      scheduled: false
    });

    this.jobs.set('main', mainJob);
    mainJob.start();

    // Hourly maintenance job
    const maintenanceJob = cron.schedule('0 * * * *', async () => {
      await this.performMaintenance();
    }, {
      scheduled: false
    });

    this.jobs.set('maintenance', maintenanceJob);
    maintenanceJob.start();

    console.log('Scan scheduler started with jobs:', Array.from(this.jobs.keys()));
  }

  stop() {
    if (!this.isRunning) {
      console.log('Scan scheduler not running');
      return;
    }

    console.log('Stopping scan scheduler...');
    
    for (const [name, job] of this.jobs) {
      job.destroy();
      console.log(`Stopped job: ${name}`);
    }
    
    this.jobs.clear();
    this.isRunning = false;
    console.log('Scan scheduler stopped');
  }

  private async checkAndRunScheduledScans() {
    try {
      console.log('Checking for scheduled scans...');
      
      // Get all active stores
      const stores = await storage.getActiveStores();
      
      for (const store of stores) {
        await this.checkStoreForScheduledScan(store.id);
      }
      
    } catch (error) {
      console.error('Error checking scheduled scans:', error);
    }
  }

  private async checkStoreForScheduledScan(storeId: string) {
    try {
      // Get alert settings to determine scan frequency
      const settings = await storage.getAlertSettings(storeId);
      if (!settings) {
        return;
      }

      // Get last scan for this store
      const lastScan = await storage.getLastScanForStore(storeId);
      
      // Determine if scan is due based on frequency (in minutes)
      const scanFrequency = this.getScanFrequency(settings);
      const now = new Date();
      
      let shouldScan = false;
      
      if (!lastScan) {
        // No previous scan, run one now
        shouldScan = true;
      } else {
        const timeSinceLastScan = now.getTime() - lastScan.createdAt.getTime();
        const frequencyMs = scanFrequency * 60 * 1000; // Convert to milliseconds
        
        shouldScan = timeSinceLastScan >= frequencyMs;
      }

      if (shouldScan) {
        await this.triggerAutomaticScan(storeId);
      }
      
    } catch (error) {
      console.error(`Error checking scan schedule for store ${storeId}:`, error);
    }
  }

  private async triggerAutomaticScan(storeId: string) {
    try {
      const store = await storage.getStoreById(storeId);
      if (!store || !store.isActive) {
        return;
      }

      console.log(`Triggering automatic scan for store: ${store.storeName}`);

      // Create scan record
      const scanId = uuidv4();
      const scan = await storage.createScan({
        id: scanId,
        storeId: store.id,
        type: 'full_site',
        status: 'pending'
      });

      // Determine store URL
      const storeUrl = this.getStoreUrl(store.shopifyDomain);

      // Execute scan asynchronously
      this.executeScanAsync({
        storeId: store.id,
        scanType: 'full_site',
        url: storeUrl,
        scanId: scan.id
      });

    } catch (error) {
      console.error(`Error triggering automatic scan for store ${storeId}:`, error);
    }
  }

  private async executeScanAsync(scanRequest: any) {
    try {
      await scanEngine.executeScan(scanRequest);
    } catch (error) {
      console.error('Async scan execution error:', error);
    }
  }

  private getScanFrequency(settings: any): number {
    // Default to 60 minutes if no specific frequency is set
    // In a real implementation, you'd have a scanFrequency field in alert settings
    return 60; // 1 hour default
  }

  private getStoreUrl(shopifyDomain: string): string {
    // Convert Shopify domain to public URL
    if (shopifyDomain.includes('.myshopify.com')) {
      // For .myshopify.com domains, use them directly
      return `https://${shopifyDomain}`;
    } else {
      // For custom domains, assume https
      return `https://${shopifyDomain}`;
    }
  }

  private async performMaintenance() {
    try {
      console.log('Performing scheduled maintenance...');
      
      // Clean up old scans (keep last 100 per store)
      await this.cleanupOldScans();
      
      // Clean up resolved bugs older than 30 days
      await this.cleanupOldBugs();
      
      console.log('Maintenance completed');
      
    } catch (error) {
      console.error('Maintenance error:', error);
    }
  }

  private async cleanupOldScans() {
    try {
      // This would be implemented in storage layer
      // For now, just log the intent
      console.log('Cleaning up old scans...');
    } catch (error) {
      console.error('Error cleaning up old scans:', error);
    }
  }

  private async cleanupOldBugs() {
    try {
      // This would be implemented in storage layer
      // For now, just log the intent
      console.log('Cleaning up old resolved bugs...');
    } catch (error) {
      console.error('Error cleaning up old bugs:', error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      activeScans: scanEngine.getActivescans()
    };
  }
}

export const scanScheduler = new ScanScheduler();