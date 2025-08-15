import { storage } from "../storage";
import { analyzePerformanceIssues } from "./lighthouse-scanner";
import { crawlWebsite } from "./web-crawler";
import { scheduleAlert } from "../alert-delay";
import type {
  InsertBug,
  InsertPerformanceMetric,
  InsertAlert,
} from "@shared/schema";

// Optional Slack imports - will be undefined if environment variables are not set
let slackModule: any = null;

// Optional Email imports - will be undefined if environment variables are not set
let emailModule: any = null;

export interface ScanRequest {
  storeId: string;
  scanType: "full_site";
  url: string;
  scanId: string;
  deviceType?: "mobile" | "desktop";
}

export interface ScanResult {
  scanId: string;
  status: "completed" | "failed";
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
      slackModule = await import("../slack");
      console.log("Slack module loaded successfully");
    } catch (error) {
      console.log("Slack module not available - Slack notifications disabled");
    }

    // Initialize Email module if available
    try {
      emailModule = await import("../email");
      console.log("Email module loaded successfully");
    } catch (error) {
      console.log("Email module not available - Email notifications disabled");
    }
  }

  async executeScan(request: ScanRequest): Promise<ScanResult> {
    const { storeId, scanType, url, scanId } = request;
    // Always run both mobile and desktop scans
    const deviceTypes: ("mobile" | "desktop")[] = ["mobile", "desktop"];

    if (this.activescans.has(scanId)) {
      throw new Error("Scan already in progress");
    }

    this.activescans.set(scanId, true);
    const startTime = Date.now();

    // Check if test mode is enabled
    const { serverConfig } = await import("../../config/environments");
    const actualUrl = serverConfig.testMode ? serverConfig.testWebsite : url;

    try {


      let totalIssues = 0;
      let totalPagesScanned = 0;
      let overallPerformanceScore: number | undefined;

      // Run scan for both device types
      for (const deviceType of deviceTypes) {

        // Create a separate scan record for each device type
        const deviceScanId = `${scanId}-${deviceType}`;
        await storage.updateScan(deviceScanId, {
          status: "running",
          deviceType: deviceType,
        });

        let deviceIssues = 0;
        let devicePagesScanned = 0;
        let devicePerformanceScore: number | undefined;

        const fullResult = await this.fullSiteScan(
          actualUrl,
          storeId,
          deviceType
        );
        deviceIssues = fullResult.issues;
        devicePagesScanned = fullResult.pages;
        devicePerformanceScore = fullResult.performanceScore;

        // Update device-specific scan with results
        await storage.updateScan(deviceScanId, {
          status: "completed",
          pagesScanned: devicePagesScanned,
          duration: Math.round((Date.now() - startTime) / 1000),
          completedAt: new Date(),
        });

        // Accumulate totals
        totalIssues += deviceIssues;
        totalPagesScanned += devicePagesScanned;

        // Use the better performance score
        if (devicePerformanceScore !== undefined) {
          if (
            overallPerformanceScore === undefined ||
            devicePerformanceScore > overallPerformanceScore
          ) {
            overallPerformanceScore = devicePerformanceScore;
          }
        }

        console.log(
          `${deviceType} scan completed: ${deviceIssues} issues found, ${devicePagesScanned} pages scanned, score: ${
            devicePerformanceScore || "N/A"
          }`
        );
      }

      const duration = Math.round((Date.now() - startTime) / 1000);

      // Update main scan with aggregated results
      await storage.updateScan(scanId, {
        status: "completed",
        pagesScanned: totalPagesScanned,
        duration,
        completedAt: new Date(),
      });

      // Create scan summary alert
      await this.createScanSummaryAlert(
        storeId,
        scanType,
        totalIssues,
        duration
      );

      // Send notifications
      await this.sendNotifications(storeId, totalIssues, duration, scanType);



      return {
        scanId,
        status: "completed",
        pagesScanned: totalPagesScanned,
        duration,
        issuesFound: totalIssues,
        performanceScore: overallPerformanceScore,
      };
    } catch (error) {
      console.error(`Scan ${scanId} failed:`, error);

      // Update scan status to failed
      await storage.updateScan(scanId, {
        status: "failed",
        completedAt: new Date(),
      });

      // Create failure alert
      try {
        const failureAlert: InsertAlert = {
          storeId,
          type: "critical",
          title: "Scan Failed",
          message: `${scanType} scan failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          status: "active",
          source: scanType,
          metadata: {
            scanType,
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
          },
        };
        await storage.createAlert(failureAlert);
      } catch (alertError) {
        console.error("Failed to create failure alert:", alertError);
      }

      return {
        scanId,
        status: "failed",
        pagesScanned: 0,
        duration: Math.round((Date.now() - startTime) / 1000),
        issuesFound: 0,
      };
    } finally {
      this.activescans.delete(scanId);
    }
  }

  private async fullSiteScan(
    url: string,
    storeId: string,
    deviceType: "mobile" | "desktop" = "desktop"
  ): Promise<{
    issues: number;
    pages: number;
    performanceScore?: number;
  }> {
    try {
      // Get alert settings for custom thresholds
      const settings = await storage.getAlertSettings(storeId);

      // Step 1: Crawl website to find all pages (Lighthouse)
      let crawlResults;
      try {
        crawlResults = await crawlWebsite(url, 10, deviceType);
        console.log(
          `Crawl completed for ${deviceType}: ${crawlResults.issues.length} issues found, ${crawlResults.summary.totalPages} pages scanned`
        );
      } catch (crawlError) {
        console.error(`Crawl failed for ${deviceType}:`, crawlError);
        crawlResults = { issues: [], summary: { totalPages: 0 } };
      }

      // Step 2: Run performance audit using PageSpeed Insights (more accurate)
      console.log(
        `Step 2: Running PageSpeed Insights performance audit for ${deviceType}...`
      );
      let performanceResults;
      try {
        const { runPageSpeedAudit } = await import("./pagespeed-scanner");
        const { serverConfig } = await import("../../config/environments");

        if (serverConfig.pagespeedApiKey) {
          performanceResults = await runPageSpeedAudit(
            url,
            deviceType,
            serverConfig.pagespeedApiKey
          );

        } else {
          throw new Error("PageSpeed API key not available");
        }
      } catch (pagespeedError: any) {
        console.error(
          `PageSpeed performance audit failed for ${deviceType}:`,
          pagespeedError.message
        );
      }

      // Step 3: Run comprehensive bug detection using Lighthouse
      let bugDetectionResults;
      try {
        const { runLighthouseAudit } = await import("./lighthouse-scanner");
        bugDetectionResults = await runLighthouseAudit(url, deviceType);
      } catch (lighthouseError: any) {
        console.error(
          `Lighthouse bug detection failed for ${deviceType}:`,
          lighthouseError.message
        );
        throw new Error(
          `Bug detection failed for ${deviceType}: ${lighthouseError.message}`
        );
      }

      // Step 4: Save crawl issues from Lighthouse
      let totalIssues = crawlResults.issues.length;
      for (const issue of crawlResults.issues) {
        const bug: InsertBug = {
          storeId,
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          type: issue.type as any,
          url: issue.url,
          status: "open",
          deviceType: deviceType,
          details: issue.details || null,
        };

        await storage.createBug(bug);
        await this.createAlertForBug(bug, "full_site");
      }

      // Step 5: Save performance metrics from PageSpeed Insights
      try {
        const perfMetric: InsertPerformanceMetric = {
          storeId,
          deviceType: deviceType,
          lcp: performanceResults?.lcp.toString(),
          fcp: performanceResults?.fcp.toString(),
          cls: performanceResults?.cls.toString(),
          overallScore: performanceResults?.overallScore,
          // Use PageSpeed scores for weighted store health calculation
          performanceScore: performanceResults?.overallScore,
          accessibilityScore: performanceResults?.accessibility,
          bestPracticesScore: performanceResults?.bestPractices,
          seoScore: performanceResults?.seo,
          pwaScore: 0, // PWA score not captured by PageSpeed
          // Additional metrics
          timeToInteractive: performanceResults?.timeToInteractive,
          speedIndex: performanceResults?.speedIndex,
          // Store detailed audit results from PageSpeed
          auditOpportunities: performanceResults?.audits?.opportunities || [],
          auditDiagnostics: performanceResults?.audits?.diagnostics || [],
          auditPassed: performanceResults?.audits?.passedAudits || [],
          // Mark which engine was used for performance
          scanEngine: performanceResults?.scanEngine || "pagespeed",
        };

        await storage.createPerformanceMetric(perfMetric);
      } catch (saveError: any) {
        console.error(
          `Failed to save performance metrics for ${deviceType}:`,
          saveError.message
        );
      }

      // Step 6: Save bugs from Lighthouse bug detection
      console.log(
        `Step 6: Saving bugs from Lighthouse detection for ${deviceType}...`
      );
      try {
        // Analyze performance issues from PageSpeed results
        const { analyzePerformanceIssues } = await import(
          "./lighthouse-scanner"
        );
        const performanceIssues = analyzePerformanceIssues(
          performanceResults as any,
          settings
            ? {
                responseTimeThreshold:
                  settings.responseTimeThreshold || undefined,
                performanceThreshold:
                  settings.performanceThreshold || undefined,
              }
            : undefined
        );

        // Save performance-related bugs
        for (const issue of performanceIssues) {
          if (issue.severity === "critical" || issue.severity === "warning") {
            const bug: InsertBug = {
              storeId,
              title: issue.title,
              description: issue.description,
              severity: issue.severity,
              type: issue.type as any,
              url: url,
              status: "open",
              deviceType: deviceType,
              details: issue.details || null,
            };

            await storage.createBug(bug);
            await this.createAlertForBug(bug, "performance");
            totalIssues++;
          }
        }

        // Save accessibility and other bugs from Lighthouse
        if (bugDetectionResults.accessibility < 80) {
          const bug: InsertBug = {
            storeId,
            title: "Accessibility Issues",
            description: `Accessibility score of ${bugDetectionResults.accessibility}/100 may prevent users from accessing your site`,
            severity:
              bugDetectionResults.accessibility < 50 ? "critical" : "warning",
            type: "accessibility",
            url: url,
            status: "open",
            deviceType: deviceType,
            details: {
              metric: "Accessibility Score",
              value: bugDetectionResults.accessibility,
              threshold: 80,
              impact:
                "High - Users with disabilities may not be able to use the site",
            },
          };

          await storage.createBug(bug);
          await this.createAlertForBug(bug, "accessibility");
          totalIssues++;
        }

        // Save SEO bugs
        if (bugDetectionResults.seo < 80) {
          const bug: InsertBug = {
            storeId,
            title: "SEO Optimization Needed",
            description: `SEO score of ${bugDetectionResults.seo}/100 could impact search engine rankings`,
            severity: bugDetectionResults.seo < 50 ? "critical" : "warning",
            type: "seo",
            url: url,
            status: "open",
            deviceType: deviceType,
            details: {
              metric: "SEO Score",
              value: bugDetectionResults.seo,
              threshold: 80,
              impact: "Medium - Poor SEO can reduce search visibility",
            },
          };

          await storage.createBug(bug);
          await this.createAlertForBug(bug, "seo");
          totalIssues++;
        }

      } catch (bugSaveError: any) {
        console.error(
          `Failed to save bugs for ${deviceType}:`,
          bugSaveError.message
        );
      }

      const performanceScore = performanceResults?.overallScore;

      return {
        issues: totalIssues,
        pages: crawlResults.summary.totalPages,
        performanceScore,
      };
    } catch (error) {
      console.error(`HYBRID full site scan error for ${deviceType}:`, error);
      // Return fallback results instead of throwing
      return {
        issues: 0,
        pages: 0,
        performanceScore: 30,
      };
    }
  }

  private async createAlertForBug(
    bug: InsertBug,
    scanType: string
  ): Promise<void> {
    try {
      // Get alert settings to check thresholds
      const settings = await storage.getAlertSettings(bug.storeId);
      if (!settings) {
        console.log(
          `No alert settings found for store ${bug.storeId}, creating alert anyway`
        );
      }

      // Check if we should create an alert based on thresholds
      let shouldCreateAlert = true;

      if (settings) {




        // Check error rate threshold
        if (bug.title.toLowerCase().includes("error rate")) {
          if (settings.errorRateThreshold) {
            // This would need to be implemented based on actual error rate data
            console.log(
              `Error rate issue detected, checking against threshold: ${settings.errorRateThreshold}%`
            );
          }
        }
      }

      if (shouldCreateAlert) {
        const alert: InsertAlert = {
          storeId: bug.storeId,
          type: bug.severity as "critical" | "warning" | "info",
          title: bug.title,
          message: bug.description,
          status: "active",
          source: scanType,
          metadata: {
            url: bug.url,
            bugType: bug.type,
          },
        };

        await storage.createAlert(alert);
        console.log(`Alert created for bug: ${bug.title}`);
      } else {
        console.log(`Alert skipped for bug: ${bug.title} (below threshold)`);
      }
    } catch (error) {
      console.error("Failed to create alert for bug:", error as Error);
    }
  }

  private async createScanSummaryAlert(
    storeId: string,
    scanType: string,
    issuesFound: number,
    duration: number
  ): Promise<void> {
    try {
      // Get alert settings to check thresholds
      const settings = await storage.getAlertSettings(storeId);

      let alertType: "critical" | "warning" | "info" = "info";
      let title = "Scan Completed";
      let message = `Scan completed successfully with ${issuesFound} issues found.`;

      // Determine alert type based on issues found and thresholds
      if (settings) {
        // Use custom thresholds if available, otherwise use defaults
        const criticalThreshold = settings.performanceThreshold || 10;
        const warningThreshold = Math.floor(criticalThreshold / 2);

        if (issuesFound > criticalThreshold) {
          alertType = "critical";
          title = "Critical Issues Detected";
          message = `🚨 Critical Alert: ${scanType} scan found ${issuesFound} issues requiring immediate attention!`;
        } else if (issuesFound > warningThreshold) {
          alertType = "warning";
          title = "Issues Detected";
          message = `⚠️ Warning: ${scanType} scan found ${issuesFound} issues that need attention.`;
        }
      } else {
        // Fallback to default thresholds
        if (issuesFound > 10) {
          alertType = "critical";
          title = "Critical Issues Detected";
          message = `🚨 Critical Alert: ${scanType} scan found ${issuesFound} issues requiring immediate attention!`;
        } else if (issuesFound > 5) {
          alertType = "warning";
          title = "Issues Detected";
          message = `⚠️ Warning: ${scanType} scan found ${issuesFound} issues that need attention.`;
        }
      }

      const alert: InsertAlert = {
        storeId,
        type: alertType,
        title,
        message,
        status: "active",
        source: scanType,
        metadata: {
          scanType,
          issuesFound,
          duration,
          timestamp: new Date().toISOString(),
        },
      };

      await storage.createAlert(alert);
    } catch (error) {
      console.error("Failed to create scan summary alert:", error as Error);
    }
  }

  private async sendNotifications(
    storeId: string,
    issuesFound: number,
    duration: number,
    scanType: string
  ) {
    try {
      const store = await storage.getStore(storeId);
      const settings = await storage.getAlertSettings(storeId);

      if (!store || !settings) {
        return;
      }

      const durationStr =
        duration > 60
          ? `${Math.floor(duration / 60)}m ${duration % 60}s`
          : `${duration}s`;

      const dashboardUrl = `https://2f327d9ba6b7.ngrok-free.ap/dashboard`;

      // Check if any notifications are enabled
      const hasSlackEnabled =
        settings.slackEnabled &&
        settings.slackBotToken &&
        settings.slackChannelId;
      const hasEmailEnabled = settings.emailEnabled && settings.emailAddress;

      // Schedule Slack scan completion notification
      if (hasSlackEnabled) {
        const slackData = {
          title: "Scan Completed",
          message: `✅ ${scanType} scan completed for ${store.storeName}\n\n📊 **Results:**\n• Issues Found: ${issuesFound}\n• Duration: ${durationStr}\n• Pages Scanned: 1`,
          severity: issuesFound > 5 ? "warning" : "info",
          storeName: store.storeName,
          storeUrl: dashboardUrl,
          issueCount: issuesFound,
        };
        await scheduleAlert(storeId, "slack", slackData);
      }

      // Schedule Email scan completion notification
      if (hasEmailEnabled) {
        const emailData = {
          to: settings.emailAddress!,
          subject: `Scan Completed - ${store.storeName}`,
          template: "scan-completed",
          data: {
            storeName: store.storeName,
            issuesFound,
            duration: durationStr,
            dashboardUrl,
          },
        };
        await scheduleAlert(storeId, "email", emailData);
      }

      // Schedule critical issue alerts if many issues found
      if (issuesFound > 5) {
        const criticalMessage = `🚨 Critical Alert: ${scanType} scan completed with ${issuesFound} issues requiring immediate attention`;

        // Schedule Slack critical alert
        if (hasSlackEnabled) {
          const criticalSlackData = {
            title: "Critical Issues Detected",
            message: criticalMessage,
            severity: "critical",
            storeName: store.storeName,
            storeUrl: dashboardUrl,
            issueCount: issuesFound,
          };
          await scheduleAlert(storeId, "slack", criticalSlackData);
        }

        // Schedule Email critical alert
        if (hasEmailEnabled) {
          const criticalEmailData = {
            to: settings.emailAddress!,
            subject: `Critical Issues Detected - ${store.storeName}`,
            template: "critical-issues",
            data: {
              storeName: store.storeName,
              scanType: `${scanType} scan`,
              message: criticalMessage,
              dashboardUrl,
            },
          };
          await scheduleAlert(storeId, "email", criticalEmailData);
        }
      }


    } catch (error) {
      console.error("Error in sendNotifications:", error);
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
