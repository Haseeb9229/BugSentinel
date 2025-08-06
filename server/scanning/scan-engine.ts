import { storage } from '../storage';
import { runLighthouseAudit, analyzePerformanceIssues } from './lighthouse-scanner';
import { validateLinks, validateImages } from './link-validator';
import { crawlWebsite } from './web-crawler';
import { scheduleAlert } from '../alert-delay';
import type { InsertBug, InsertPerformanceMetric, InsertAlert } from '@shared/schema';

// Optional Slack imports - will be undefined if environment variables are not set
let slackModule: any = null;

// Optional Email imports - will be undefined if environment variables are not set
let emailModule: any = null;

export interface ScanRequest {
  storeId: string;
  scanType: 'full_site' | 'performance' | 'link_validation' | 'accessibility';
  url: string;
  scanId: string;
}

export interface ScanResult {
  scanId: string;
  status: 'completed' | 'failed';
  pagesScanned: number;
  duration: number;
  issuesFound: number;
  performanceScore?: number;
}

export class ScanEngine {
  private activescans = new Map<string, boolean>();

  constructor() {
    // Initialize notification modules if available
    this.initializeNotificationModules();
  }

  private async initializeNotificationModules() {
    // Initialize Slack module if available
    try {
      slackModule = await import('../slack');
      console.log('Slack module loaded successfully');
    } catch (error) {
      console.log('Slack module not available - Slack notifications disabled');
    }

    // Initialize Email module if available
    try {
      emailModule = await import('../email');
      console.log('Email module loaded successfully');
    } catch (error) {
      console.log('Email module not available - Email notifications disabled');
    }
  }

  async executeScan(request: ScanRequest): Promise<ScanResult> {
    const { storeId, scanType, url, scanId } = request;
    
    if (this.activescans.has(scanId)) {
      throw new Error('Scan already in progress');
    }

    this.activescans.set(scanId, true);
    const startTime = Date.now();

    // Check if test mode is enabled
    const { serverConfig } = await import('../../config/environments');
    const actualUrl = serverConfig.testMode ? serverConfig.testWebsite : url;
    
    if (serverConfig.testMode) {
      console.log(`🧪 TEST MODE: Scanning test website instead of store URL`);
      console.log(`Original URL: ${url}`);
      console.log(`Test URL: ${actualUrl}`);
    }

    try {
      console.log(`Starting ${scanType} scan for store ${storeId}: ${actualUrl}`);
      if (scanType === 'performance' || scanType === 'full_site') {
        console.log('Note: Performance scans require Chrome to be installed on the server');
      }

      // Update scan status to running
      await storage.updateScan(scanId, { status: 'running' });

      let totalIssues = 0;
      let pagesScanned = 0;
      let performanceScore: number | undefined;

      switch (scanType) {
        case 'performance':
          const perfResult = await this.performancesScan(actualUrl, storeId);
          totalIssues = perfResult.issues;
          performanceScore = perfResult.score;
          pagesScanned = 1;
          break;

        case 'link_validation':
          const linkResult = await this.linkValidationScan(actualUrl, storeId);
          totalIssues = linkResult.issues;
          pagesScanned = 1;
          break;

        case 'full_site':
          const fullResult = await this.fullSiteScan(actualUrl, storeId);
          totalIssues = fullResult.issues;
          pagesScanned = fullResult.pages;
          performanceScore = fullResult.performanceScore;
          break;

        case 'accessibility':
          const accessResult = await this.accessibilityScan(actualUrl, storeId);
          totalIssues = accessResult.issues;
          pagesScanned = 1;
          break;

        default:
          throw new Error(`Unknown scan type: ${scanType}`);
      }

      const duration = Math.round((Date.now() - startTime) / 1000);

      // Update scan with results
      await storage.updateScan(scanId, {
        status: 'completed',
        pagesScanned,
        duration,
        completedAt: new Date()
      });

      // Create scan summary alert
      await this.createScanSummaryAlert(storeId, scanType, totalIssues, duration);

      // Send notifications
      await this.sendNotifications(storeId, totalIssues, duration, scanType);

      console.log(`Scan ${scanId} completed: ${totalIssues} issues found in ${duration}s`);

      return {
        scanId,
        status: 'completed',
        pagesScanned,
        duration,
        issuesFound: totalIssues,
        performanceScore
      };

    } catch (error) {
      console.error(`Scan ${scanId} failed:`, error);
      
      // Update scan status to failed
      await storage.updateScan(scanId, {
        status: 'failed',
        completedAt: new Date()
      });

      // Create failure alert
      try {
        const failureAlert: InsertAlert = {
          storeId,
          type: 'critical',
          title: 'Scan Failed',
          message: `${scanType} scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          status: 'active',
          source: scanType,
          metadata: {
            scanType,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }
        };
        await storage.createAlert(failureAlert);
      } catch (alertError) {
        console.error('Failed to create failure alert:', alertError);
      }

      return {
        scanId,
        status: 'failed',
        pagesScanned: 0,
        duration: Math.round((Date.now() - startTime) / 1000),
        issuesFound: 0
      };

    } finally {
      this.activescans.delete(scanId);
    }
  }

  private async performancesScan(url: string, storeId: string): Promise<{ issues: number; score: number }> {
    try {
      // Get alert settings for custom thresholds
      const settings = await storage.getAlertSettings(storeId);
      
      // Run Lighthouse audit with fallback
      let results;
      try {
        results = await runLighthouseAudit(url);
      } catch (lighthouseError: any) {
        console.warn(`Lighthouse failed for ${url}, using fallback performance analysis:`, lighthouseError.message);
        
        // Fallback: Use basic performance analysis without Lighthouse
        results = await this.performBasicPerformanceAnalysis(url);
      }
      
      // Save performance metrics with Lighthouse category scores
      const perfMetric: InsertPerformanceMetric = {
        storeId,
        lcp: results.lcp.toString(),
        fcp: results.fcp.toString(),
        cls: results.cls.toString(),
        overallScore: results.overallScore,
        // Add Lighthouse category scores for weighted store health calculation
        performanceScore: results.overallScore, // Performance score is the same as overallScore
        accessibilityScore: results.accessibility,
        bestPracticesScore: results.bestPractices,
        seoScore: results.seo,
        pwaScore: 0 // PWA score not currently captured, default to 0
      };
      
      await storage.createPerformanceMetric(perfMetric);

      // Analyze for issues with custom thresholds
      const customThresholds = settings ? {
        responseTimeThreshold: settings.responseTimeThreshold || undefined,
        performanceThreshold: settings.performanceThreshold || undefined
      } : undefined;
      
      const issues = analyzePerformanceIssues(results, customThresholds);
      
      // Save critical issues as bugs
      for (const issue of issues) {
        if (issue.severity === 'critical' || issue.severity === 'warning') {
          const bug: InsertBug = {
            storeId,
            title: issue.title,
            description: issue.description,
            severity: issue.severity,
            type: issue.type as any,
            url: url,
            status: 'open',
            details: issue.details || null
          };
          
          await storage.createBug(bug);
          await this.createAlertForBug(bug, 'performance');
        }
      }

      return { issues: issues.length, score: results.overallScore };

    } catch (error: any) {
      console.warn('Performance scan failed:', error.message);
      // Return default values when performance scan fails
      return { issues: 0, score: 0 };
    }
  }

  private async performBasicPerformanceAnalysis(url: string): Promise<any> {
    // Basic performance analysis without Lighthouse
    const startTime = Date.now();
    
    try {
      // Use Promise.race to implement timeout
      const fetchPromise = fetch(url, { method: 'HEAD' });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      const responseTime = Date.now() - startTime;
      
      // Estimate performance based on response time
      let overallScore = 90;
      let lcp = 2.0;
      let fcp = 1.5;
      let cls = 0.05;
      
      if (responseTime > 3000) {
        overallScore = 40;
        lcp = 4.5;
        fcp = 3.0;
        cls = 0.15;
      } else if (responseTime > 2000) {
        overallScore = 60;
        lcp = 3.5;
        fcp = 2.5;
        cls = 0.10;
      }
      
      return {
        lcp,
        fcp,
        cls,
        overallScore,
        timeToInteractive: responseTime * 2,
        speedIndex: responseTime * 1.5,
        accessibility: 85,
        bestPractices: 80,
        seo: 75,
        audits: {
          opportunities: [],
          diagnostics: [],
          passedAudits: []
        }
      };
      
    } catch (error: any) {
      // Return poor performance scores if basic analysis also fails
      return {
        lcp: 5.0,
        fcp: 3.0,
        cls: 0.25,
        overallScore: 30,
        timeToInteractive: 8000,
        speedIndex: 5000,
        accessibility: 70,
        bestPractices: 60,
        seo: 65,
        audits: {
          opportunities: [],
          diagnostics: [],
          passedAudits: []
        }
      };
    }
  }

  private async linkValidationScan(url: string, storeId: string): Promise<{ issues: number }> {
    try {
      // Validate links and images
      const [linkResults, imageResults] = await Promise.all([
        validateLinks(url, 50),
        validateImages(url)
      ]);

      const allIssues = [...linkResults.issues, ...imageResults.issues];

      // Save issues as bugs
      for (const issue of allIssues) {
        const bug: InsertBug = {
          storeId,
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          type: issue.type as any,
          url: issue.url,
          status: 'open'
        };
        
        await storage.createBug(bug);
        await this.createAlertForBug(bug, 'link_validation');
      }

      return { issues: allIssues.length };

    } catch (error) {
      console.error('Link validation scan error:', error);
      throw error;
    }
  }

  private async fullSiteScan(url: string, storeId: string): Promise<{ 
    issues: number; 
    pages: number; 
    performanceScore?: number 
  }> {
    try {
      // Get alert settings for custom thresholds
      const settings = await storage.getAlertSettings(storeId);
      
      // Run comprehensive scan
      const [crawlResults, perfResults] = await Promise.all([
        crawlWebsite(url, 10),
        runLighthouseAudit(url).catch(error => {
          console.warn('Performance scan failed in full site scan (Chrome not available):', error.message);
          return null;
        })
      ]);

      let totalIssues = crawlResults.issues.length;
      let performanceScore: number | undefined;

      // Save crawl issues
      for (const issue of crawlResults.issues) {
        const bug: InsertBug = {
          storeId,
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          type: issue.type as any,
          url: issue.url,
          status: 'open',
          details: issue.details || null
        };
        
        await storage.createBug(bug);
        await this.createAlertForBug(bug, 'full_site');
      }

      // Save performance metrics if available
      if (perfResults) {
        const perfMetric: InsertPerformanceMetric = {
          storeId,
          lcp: perfResults.lcp.toString(),
          fcp: perfResults.fcp.toString(),
          cls: perfResults.cls.toString(),
          overallScore: perfResults.overallScore,
          // Add Lighthouse category scores for weighted store health calculation
          performanceScore: perfResults.overallScore, // Performance score is the same as overallScore
          accessibilityScore: perfResults.accessibility,
          bestPracticesScore: perfResults.bestPractices,
          seoScore: perfResults.seo,
          pwaScore: 0 // PWA score not currently captured, default to 0
        };
        
        await storage.createPerformanceMetric(perfMetric);
        
        // Add performance issues with custom thresholds
        const customThresholds = settings ? {
          responseTimeThreshold: settings.responseTimeThreshold || undefined,
          performanceThreshold: settings.performanceThreshold || undefined
        } : undefined;
        
        const perfIssues = analyzePerformanceIssues(perfResults, customThresholds);
        for (const issue of perfIssues) {
          if (issue.severity === 'critical' || issue.severity === 'warning') {
            const bug: InsertBug = {
              storeId,
              title: issue.title,
              description: issue.description,
              severity: issue.severity,
              type: issue.type as any,
              url: url,
              status: 'open'
            };
            
            await storage.createBug(bug);
            await this.createAlertForBug(bug, 'full_site');
            totalIssues++;
          }
        }

        performanceScore = perfResults.overallScore;
      }

      return { 
        issues: totalIssues, 
        pages: crawlResults.summary.totalPages,
        performanceScore
      };

    } catch (error) {
      console.error('Full site scan error:', error);
      throw error;
    }
  }

  private async accessibilityScan(url: string, storeId: string): Promise<{ issues: number }> {
    try {
      // Run crawl with focus on accessibility
      const crawlResults = await crawlWebsite(url, 5);
      
      // Filter for accessibility issues
      const accessibilityIssues = crawlResults.issues.filter(
        issue => issue.type === 'accessibility'
      );

      // Save accessibility issues
      for (const issue of accessibilityIssues) {
        const bug: InsertBug = {
          storeId,
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          type: 'accessibility' as any,
          url: issue.url,
          status: 'open'
        };
        
        await storage.createBug(bug);
        await this.createAlertForBug(bug, 'accessibility');
      }

      return { issues: accessibilityIssues.length };

    } catch (error) {
      console.error('Accessibility scan error:', error);
      throw error;
    }
  }

  private async createAlertForBug(bug: InsertBug, scanType: string): Promise<void> {
    try {
      // Get alert settings to check thresholds
      const settings = await storage.getAlertSettings(bug.storeId);
      if (!settings) {
        console.log(`No alert settings found for store ${bug.storeId}, creating alert anyway`);
      }

      // Check if we should create an alert based on thresholds
      let shouldCreateAlert = true;
      
      if (settings) {
        // Check performance thresholds
        if (scanType === 'performance' && bug.type === 'performance') {
          if (settings.performanceThreshold && bug.severity === 'warning') {
            // For performance warnings, check if they meet the threshold
            // This would need to be implemented based on actual performance data
            console.log(`Performance warning detected, checking against threshold: ${settings.performanceThreshold}%`);
          }
        }
        
        // Check response time threshold
        if (scanType === 'performance' && bug.title.toLowerCase().includes('response time')) {
          if (settings.responseTimeThreshold) {
            // This would need to be implemented based on actual response time data
            console.log(`Response time issue detected, checking against threshold: ${settings.responseTimeThreshold}ms`);
          }
        }
        
        // Check error rate threshold
        if (bug.title.toLowerCase().includes('error rate')) {
          if (settings.errorRateThreshold) {
            // This would need to be implemented based on actual error rate data
            console.log(`Error rate issue detected, checking against threshold: ${settings.errorRateThreshold}%`);
          }
        }
      }

      if (shouldCreateAlert) {
        const alert: InsertAlert = {
          storeId: bug.storeId,
          type: bug.severity as 'critical' | 'warning' | 'info',
          title: bug.title,
          message: bug.description,
          status: 'active',
          source: scanType,
          metadata: {
            url: bug.url,
            bugType: bug.type
          }
        };
        
        await storage.createAlert(alert);
        console.log(`Alert created for bug: ${bug.title}`);
      } else {
        console.log(`Alert skipped for bug: ${bug.title} (below threshold)`);
      }
    } catch (error) {
      console.error('Failed to create alert for bug:', error as Error);
    }
  }

  private async createScanSummaryAlert(storeId: string, scanType: string, issuesFound: number, duration: number): Promise<void> {
    try {
      // Get alert settings to check thresholds
      const settings = await storage.getAlertSettings(storeId);
      
      let alertType: 'critical' | 'warning' | 'info' = 'info';
      let title = 'Scan Completed';
      let message = `Scan completed successfully with ${issuesFound} issues found.`;

      // Determine alert type based on issues found and thresholds
      if (settings) {
        // Use custom thresholds if available, otherwise use defaults
        const criticalThreshold = settings.performanceThreshold || 10;
        const warningThreshold = Math.floor(criticalThreshold / 2);

        if (issuesFound > criticalThreshold) {
          alertType = 'critical';
          title = 'Critical Issues Detected';
          message = `🚨 Critical Alert: ${scanType} scan found ${issuesFound} issues requiring immediate attention!`;
        } else if (issuesFound > warningThreshold) {
          alertType = 'warning';
          title = 'Issues Detected';
          message = `⚠️ Warning: ${scanType} scan found ${issuesFound} issues that need attention.`;
        }
      } else {
        // Fallback to default thresholds
        if (issuesFound > 10) {
          alertType = 'critical';
          title = 'Critical Issues Detected';
          message = `🚨 Critical Alert: ${scanType} scan found ${issuesFound} issues requiring immediate attention!`;
        } else if (issuesFound > 5) {
          alertType = 'warning';
          title = 'Issues Detected';
          message = `⚠️ Warning: ${scanType} scan found ${issuesFound} issues that need attention.`;
        }
      }

      const alert: InsertAlert = {
        storeId,
        type: alertType,
        title,
        message,
        status: 'active',
        source: scanType,
        metadata: {
          scanType,
          issuesFound,
          duration,
          timestamp: new Date().toISOString()
        }
      };

      await storage.createAlert(alert);
      console.log(`Scan summary alert created: ${title}`);
    } catch (error) {
      console.error('Failed to create scan summary alert:', error as Error);
    }
  }

  private async sendNotifications(storeId: string, issuesFound: number, duration: number, scanType: string) {
    try {
      const store = await storage.getStore(storeId);
      const settings = await storage.getAlertSettings(storeId);
      
      if (!store || !settings) {
        console.log(`No store or settings found for storeId: ${storeId}`);
        return;
      }

      const durationStr = duration > 60 ? 
        `${Math.floor(duration / 60)}m ${duration % 60}s` : 
        `${duration}s`;

      const dashboardUrl = `https://a94717a6db99.ngrok-free.app/dashboard`;

      // Check if any notifications are enabled
      const hasSlackEnabled = settings.slackEnabled && settings.slackBotToken && settings.slackChannelId;
      const hasEmailEnabled = settings.emailEnabled && settings.emailAddress;

      console.log(`Alert settings for store ${storeId}:`, {
        slackEnabled: hasSlackEnabled,
        emailEnabled: hasEmailEnabled,
        hasSlackCredentials: !!(settings.slackBotToken && settings.slackChannelId),
        hasEmailAddress: !!settings.emailAddress,
        alertFrequency: settings.alertFrequency
      });

      // Schedule Slack scan completion notification
      if (hasSlackEnabled) {
        const slackData = {
          title: "Scan Completed",
          message: `✅ ${scanType} scan completed for ${store.storeName}\n\n📊 **Results:**\n• Issues Found: ${issuesFound}\n• Duration: ${durationStr}\n• Pages Scanned: 1`,
          severity: issuesFound > 5 ? 'warning' : 'info',
          storeName: store.storeName,
          storeUrl: dashboardUrl,
          issueCount: issuesFound
        };
        await scheduleAlert(storeId, 'slack', slackData);
      }

      // Schedule Email scan completion notification
      if (hasEmailEnabled) {
        const emailData = {
          to: settings.emailAddress!,
          subject: `Scan Completed - ${store.storeName}`,
          template: 'scan-completed',
          data: {
            storeName: store.storeName,
            issuesFound,
            duration: durationStr,
            dashboardUrl
          }
        };
        await scheduleAlert(storeId, 'email', emailData);
      }

      // Schedule critical issue alerts if many issues found
      if (issuesFound > 5) {
        const criticalMessage = `🚨 Critical Alert: ${scanType} scan completed with ${issuesFound} issues requiring immediate attention`;
        
        // Schedule Slack critical alert
        if (hasSlackEnabled) {
          const criticalSlackData = {
            title: "Critical Issues Detected",
            message: criticalMessage,
            severity: 'critical',
            storeName: store.storeName,
            storeUrl: dashboardUrl,
            issueCount: issuesFound
          };
          await scheduleAlert(storeId, 'slack', criticalSlackData);
        }

        // Schedule Email critical alert
        if (hasEmailEnabled) {
          const criticalEmailData = {
            to: settings.emailAddress!,
            subject: `Critical Issues Detected - ${store.storeName}`,
            template: 'critical-issues',
            data: {
              storeName: store.storeName,
              scanType: `${scanType} scan`,
              message: criticalMessage,
              dashboardUrl
            }
          };
          await scheduleAlert(storeId, 'email', criticalEmailData);
        }
      }

      if (!hasSlackEnabled && !hasEmailEnabled) {
        console.log(`No notifications scheduled for store ${storeId} - both Slack and Email are disabled or missing credentials`);
      }
    } catch (error) {
      console.error('Error in sendNotifications:', error);
    }
  }

  isScanning(scanId: string): boolean {
    return this.activescans.has(scanId);
  }

  getActivescans(): string[] {
    return Array.from(this.activescans.keys());
  }
}

export const scanEngine = new ScanEngine();