import { storage } from './storage';
import { InsertUptimeMonitoring } from '../shared/schema';

class UptimeMonitor {
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  async start() {
    if (this.isRunning) {
      console.log('Uptime monitor is already running');
      return;
    }

    console.log('🚀 Starting uptime monitoring service...');
    this.isRunning = true;

    // Run initial check
    await this.performUptimeChecks();

    // Set up interval for regular checks (every 5 minutes)
    this.interval = setInterval(async () => {
      await this.performUptimeChecks();
    }, 5 * 60 * 1000); // 5 minutes

    console.log('✅ Uptime monitoring service started (checks every 5 minutes)');
  }

  async stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 Uptime monitoring service stopped');
  }

  private async performUptimeChecks() {
    try {
      console.log('🔍 Performing uptime checks...');
      
      // Get all active stores
      const stores = await storage.getAllStores();
      const activeStores = stores.filter(store => store.isActive);

      if (activeStores.length === 0) {
        console.log('No active stores to monitor');
        return;
      }

      console.log(`Monitoring ${activeStores.length} active stores...`);

      // Check each store
      for (const store of activeStores) {
        await this.checkStoreUptime(store);
      }

      console.log('✅ Uptime checks completed');
    } catch (error) {
      console.error('❌ Error performing uptime checks:', error);
    }
  }

  private async checkStoreUptime(store: any) {
    try {
      const startTime = Date.now();
      const storeUrl = `https://${store.shopifyDomain}`;
      
      console.log(`Checking uptime for ${store.shopifyDomain}...`);

      // Perform HTTP request to check store availability
      const response = await fetch(storeUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'BugSentinel-UptimeMonitor/1.0'
        },
        // Set timeout to 10 seconds
        signal: AbortSignal.timeout(10000)
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const status = response.ok ? 'up' : 'down';
      const statusCode = response.status;

      console.log(`  ${store.shopifyDomain}: ${status} (${statusCode}) - ${responseTime}ms`);

      // Create uptime check record
      const uptimeCheck: InsertUptimeMonitoring = {
        storeId: store.id,
        status,
        responseTime,
        statusCode,
        checkedAt: new Date(),
        downFrom: status === 'down' ? new Date() : null,
        downUntil: null
      };

      await storage.createUptimeCheck(uptimeCheck);

    } catch (error) {
      console.error(`  ❌ Error checking ${store.shopifyDomain}:`, error);
      
      // Record downtime
      const uptimeCheck: InsertUptimeMonitoring = {
        storeId: store.id,
        status: 'down',
        responseTime: 0,
        statusCode: 0,
        checkedAt: new Date(),
        downFrom: new Date(),
        downUntil: null,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };

      await storage.createUptimeCheck(uptimeCheck);
    }
  }

  // Manual uptime check for a specific store
  async checkStore(storeId: string) {
    try {
      const store = await storage.getStore(storeId);
      if (!store) {
        throw new Error(`Store not found: ${storeId}`);
      }

      await this.checkStoreUptime(store);
      console.log(`✅ Manual uptime check completed for ${store.shopifyDomain}`);
    } catch (error) {
      console.error(`❌ Manual uptime check failed for store ${storeId}:`, error);
      throw error;
    }
  }

  // Get monitoring status
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.interval ? '5 minutes' : null
    };
  }
}

// Create singleton instance
export const uptimeMonitor = new UptimeMonitor();

// Auto-start monitoring when this module is imported
uptimeMonitor.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down uptime monitor...');
  await uptimeMonitor.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down uptime monitor...');
  await uptimeMonitor.stop();
  process.exit(0);
}); 