import { scanScheduler } from './server/scan-scheduler.ts';

console.log('🔍 Testing Scan Scheduler...');

// Get scheduler status
const status = scanScheduler.getStatus();
console.log('📊 Scheduler Status:', status);

// Get all scheduled scans
const scheduledScans = scanScheduler.getScheduledScans();
console.log('📋 Total Scheduled Scans:', scheduledScans.length);

scheduledScans.forEach((scan, index) => {
  console.log(`📅 Scan ${index + 1}:`);
  console.log(`   Store ID: ${scan.storeId}`);
  console.log(`   Next Scan Time: ${scan.nextScanTime.toISOString()}`);
  console.log(`   Time Until Next: ${Math.max(0, scan.nextScanTime.getTime() - Date.now()) / 1000 / 60} minutes`);
  console.log('');
});

// Test specific store ID
const testStoreId = '72b9c6d4-ed30-4519-bc9a-e077598bb929';
const storeScan = scheduledScans.find(scan => scan.storeId === testStoreId);
console.log(`🔍 Looking for store ${testStoreId}:`, storeScan ? 'FOUND' : 'NOT FOUND');
if (storeScan) {
  console.log(`   Next scan: ${storeScan.nextScanTime.toISOString()}`);
} 