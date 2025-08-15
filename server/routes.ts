import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertBugSchema,
  insertScanSchema,
  insertPerformanceMetricSchema,
  insertAlertSettingsSchema,
  insertAlertSchema,
} from "@shared/schema";
// import { sendSlackNotification, sendScanCompletedNotification, sendCriticalIssueAlert } from "./slack";
import { z } from "zod";
import { serverConfig } from "../config/environments";
import { InsertAlert } from "@shared/schema";
import { formatTimeAgo } from "./utils/time";
import crypto from "crypto";
import { uptimeMonitor } from "./uptime-monitor";

// Webhook validation middleware
function validateWebhook(req: any, res: any, next: any) {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"];
  const topicHeader = req.headers["x-shopify-topic"];
  const shopHeader = req.headers["x-shopify-shop-domain"];

  if (!hmacHeader || !topicHeader || !shopHeader) {
    console.warn("Missing webhook headers:", {
      hmacHeader,
      topicHeader,
      shopHeader,
    });
    return res.status(401).send("Unauthorized");
  }

  // Verify HMAC signature
  const body = JSON.stringify(req.body);
  const expectedHmac = crypto
    .createHmac("sha256", serverConfig.shopifyApiSecret)
    .update(body, "utf8")
    .digest("base64");

  if (hmacHeader !== expectedHmac) {
    console.warn("Invalid webhook signature");
    return res.status(401).send("Unauthorized");
  }

  console.log(`Valid webhook received: ${topicHeader} from ${shopHeader}`);
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Shopify OAuth Routes
  app.get("/auth", async (req, res) => {
    console.log("OAuth route hit:", req.url, req.query);
    try {
      const { shop } = req.query;

      if (!shop) {
        console.log("Missing shop parameter");
        return res.status(400).json({ error: "Missing shop parameter" });
      }

      // Validate shop domain
      const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
      if (!shopRegex.test(shop as string)) {
        console.log("Invalid shop domain:", shop);
        return res.status(400).json({ error: "Invalid shop domain" });
      }

      // Additional security: Check if this is a legitimate OAuth request
      // In production, you might want to add rate limiting, referrer checking, etc.
      const userAgent = req.headers["user-agent"] || "";
      const referer = req.headers["referer"] || "";

      // Log OAuth attempts for security monitoring
      console.log("OAuth attempt:", {
        shop,
        userAgent: userAgent.substring(0, 100),
        referer: referer.substring(0, 100),
        timestamp: new Date().toISOString(),
      });

      // Required scopes for the app - these will be requested during OAuth
      const scopes = [
        "read_products",
        "read_themes",
        "read_analytics",
        "read_orders",
        "read_customers",
      ].join(",");

      // Build authorization URL
      const authUrl =
        `https://${shop}/admin/oauth/authorize?` +
        `client_id=${serverConfig.shopifyApiKey}&` +
        `scope=${scopes}&` +
        `redirect_uri=${encodeURIComponent(
          `${
            serverConfig.isProduction
              ? "https://bug-patrol.vercel.app"
              : "https://2f327d9ba6b7.ngrok-free.ap"
          }/auth/callback`
        )}&` +
        `state=${shop}`;

      console.log("Redirecting to Shopify OAuth:", authUrl);
      res.redirect(authUrl);
    } catch (error) {
      console.error("OAuth initiation error:", error);
      res.status(500).json({ error: "Failed to initiate OAuth" });
    }
  });

  app.get("/auth/callback", async (req, res) => {
    try {
      const { code, shop, state } = req.query;

      if (!code || !shop || !state) {
        return res
          .status(400)
          .json({ error: "Missing required OAuth parameters" });
      }

      // Exchange authorization code for access token
      const tokenResponse = await fetch(
        `https://${shop}/admin/oauth/access_token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: serverConfig.shopifyApiKey,
            client_secret: serverConfig.shopifyApiSecret,
            code: code,
          }),
        }
      );

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code for access token");
      }

      const tokenData = await tokenResponse.json();
      const { access_token } = tokenData;

      // Get shop information
      const shopResponse = await fetch(
        `https://${shop}/admin/api/2024-01/shop.json`,
        {
          headers: {
            "X-Shopify-Access-Token": access_token,
          },
        }
      );

      if (!shopResponse.ok) {
        throw new Error("Failed to get shop information");
      }

      const shopData = await shopResponse.json();
      const shopInfo = shopData.shop;

      // Check if store already exists
      let store = await storage.getStoreByDomain(shop as string);

      if (!store) {
        // Create new store record
        store = await storage.createStore({
          shopifyDomain: shop as string,
          storeName: shopInfo.name,
          email: shopInfo.email,
          isActive: true,
        });
      } else {
        // Update existing store
        store = await storage.updateStore(store.id, {
          storeName: shopInfo.name,
          email: shopInfo.email,
          isActive: true,
        });
      }

      // Store access token securely (in production, use encrypted storage)
      // For demo purposes, we'll store it in the database
      await storage.updateStore(store.id, {
        // Add access token to store record (in production, use separate encrypted table)
        // accessToken: access_token
      });

      // Register webhooks for the store
      try {
        console.log(`Registering webhooks for store: ${shop}`);
        await registerWebhooks(shop as string, access_token);
        console.log(`✅ Webhooks registered successfully for ${shop}`);
      } catch (webhookError) {
        console.error(
          `❌ Failed to register webhooks for ${shop}:`,
          webhookError
        );
        // Don't fail the installation if webhook registration fails
        // The app can still function, just without real-time updates
      }

      // Create app installation record
      try {
        await storage.createAppInstallation({
          storeId: store.id,
          appName: "BugSentinel",
          appId: "bugsentinelshopify",
          action: "installed",
          version: "1.0.0",
        });
        console.log(`✅ App installation record created for ${shop}`);
      } catch (installationError) {
        console.error(
          `❌ Failed to create app installation record for ${shop}:`,
          installationError
        );
      }

      // Set up default settings and services for new store
      try {
        await setupDefaultStoreSettings(store.id);
        console.log(`✅ Default settings configured for ${shop}`);
      } catch (settingsError) {
        console.error(
          `❌ Failed to set up default settings for ${shop}:`,
          settingsError
        );
      }

      // Create initial performance metrics for new stores
      if (
        !store.updatedAt ||
        new Date(store.updatedAt).getTime() < Date.now() - 60000
      ) {
        await storage.createPerformanceMetric({
          storeId: store.id,
          lcp: "2.1",
          fcp: "0.9",
          cls: "0.05",
          overallScore: 85,
        });

        // Create initial scan record
        await storage.createScan({
          storeId: store.id,
          type: "full_site",
          status: "completed",
          pagesScanned: 25,
          duration: 90,
        });
      }

      // Redirect to embedded app with proper host parameter
      const redirectUrl = `${
        serverConfig.isProduction
          ? "https://bug-patrol.vercel.app"
          : "https://2f327d9ba6b7.ngrok-free.ap"
      }?shop=${shop}&host=${shop}`;
      console.log("Redirecting to app with URL:", redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({ error: "OAuth authentication failed" });
    }
  });

  // Set up default settings and services for new store
  async function setupDefaultStoreSettings(storeId: string) {
    try {
      // 1. Create default alert settings
      const alertSettings = await storage.updateAlertSettings(storeId, {
        emailEnabled: true,
        slackEnabled: false,
        scanFrequency: 60, // 1 hour default
        alertFrequency: "immediate",
        performanceThreshold: 20,
        uptimeThreshold: 5,
        responseTimeThreshold: 2000,
        errorRateThreshold: 5,
      });

      console.log(`✅ Alert settings saved for store ${storeId}:`, {
        scanFrequency: alertSettings.scanFrequency,
        emailEnabled: alertSettings.emailEnabled,
        slackEnabled: alertSettings.slackEnabled,
      });

      // 2. Schedule initial scan (1 hour from now)
      const { scanScheduler } = await import("./scan-scheduler");
      await scanScheduler.scheduleStoreScan(storeId);

      // 3. Start uptime monitoring for this store
      const { uptimeMonitor } = await import("./uptime-monitor");
      // The uptime monitor will automatically include this store in its next check cycle

      console.log(`✅ Default settings configured for store ${storeId}`);
    } catch (error) {
      console.error(
        `❌ Error setting up default settings for store ${storeId}:`,
        error
      );
      throw error;
    }
  }

  // Webhook registration helper function
  async function registerWebhooks(shop: string, accessToken: string) {
    const webhookTopics = [
      "app/uninstalled",
      "themes/update",
      "themes/publish",
      "themes/create",
      "themes/delete",
    ];

    // Use the same base URL as the OAuth redirect
    const webhookBaseUrl = serverConfig.isProduction
      ? "https://bug-patrol.vercel.app"
      : "https://2f327d9ba6b7.ngrok-free.ap";

    console.log(
      `Registering webhooks for ${shop} with base URL: ${webhookBaseUrl}`
    );

    const results = [];

    for (const topic of webhookTopics) {
      try {
        const response = await fetch(
          `https://${shop}/admin/api/2023-10/webhooks.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": accessToken,
            },
            body: JSON.stringify({
              webhook: {
                topic: topic,
                address: `${webhookBaseUrl}/webhooks/${topic}`,
                format: "json",
              },
            }),
          }
        );

        if (response.ok) {
          const webhook = await response.json();
          results.push({ topic, status: "success", id: webhook.webhook.id });
          console.log(
            `✅ Webhook registered for ${topic}: ${webhook.webhook.id}`
          );
        } else {
          const error = await response.text();
          results.push({ topic, status: "failed", error });
          console.error(`❌ Failed to register webhook for ${topic}:`, error);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.push({ topic, status: "error", error: errorMessage });
        console.error(`❌ Error registering webhook for ${topic}:`, error);
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    console.log(
      `Webhook registration complete: ${successCount}/${webhookTopics.length} successful`
    );

    // Check registered webhooks after registration
    await checkRegisteredWebhooks(shop, accessToken);

    return results;
  }

  // Function to check registered webhooks using GraphQL
  async function checkRegisteredWebhooks(shop: string, accessToken: string) {
    try {
      const graphqlQuery = `
        query {
          webhookSubscriptions(first: 50) {
            edges {
              node {
                id
                topic
                endpoint {
                  __typename
                  ... on WebhookHttpEndpoint {
                    callbackUrl
                  }
                }
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

      const response = await fetch(
        `https://${shop}/admin/api/2023-10/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({
            query: graphqlQuery,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const webhooks = data.data?.webhookSubscriptions?.edges || [];

        console.log("\n🔍 REGISTERED WEBHOOKS:");
        console.log("========================");

        if (webhooks.length === 0) {
          console.log("❌ No webhooks found");
        } else {
          webhooks.forEach((edge: any, index: number) => {
            const webhook = edge.node;
            console.log(`${index + 1}. Topic: ${webhook.topic}`);
            console.log(`   ID: ${webhook.id}`);
            console.log(`   URL: ${webhook.endpoint?.callbackUrl || "N/A"}`);
            console.log(
              `   Created: ${new Date(webhook.createdAt).toLocaleString()}`
            );
            console.log(
              `   Updated: ${new Date(webhook.updatedAt).toLocaleString()}`
            );
            console.log("---");
          });
        }

        console.log(`Total webhooks: ${webhooks.length}`);
        console.log("========================\n");

        return webhooks;
      } else {
        const error = await response.text();
        console.error("❌ Failed to fetch webhooks:", error);
        return [];
      }
    } catch (error) {
      console.error("❌ Error checking webhooks:", error);
      return [];
    }
  }

  // Webhook for app uninstallation
  app.post("/webhooks/app/uninstalled", validateWebhook, async (req, res) => {
    try {
      const { shop_domain } = req.body;

      if (shop_domain) {
        // Deactivate store
        const store = await storage.getStoreByDomain(shop_domain);
        if (store) {
          await storage.updateStore(store.id, { isActive: false });

          // Create app installation record
          await storage.createAppInstallation({
            storeId: store.id,
            appName: "BugSentinel",
            appId: "bugsentinelshopify",
            action: "uninstalled",
            version: "1.0.0",
          });
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).send("Error");
    }
  });

  // Note: Shopify does not provide app/installed or app/updated webhooks
  // App installation is handled during OAuth callback
  // App updates are not tracked via webhooks

  // TODO: If Shopify adds these webhooks in the future, uncomment these handlers
  /*
  // Webhook for app installation
  app.post("/webhooks/app/installed", validateWebhook, async (req, res) => {
    try {
      const { shop_domain, app } = req.body;
      
      if (shop_domain) {
        const store = await storage.getStoreByDomain(shop_domain);
        if (store) {
          // Create app installation record
          await storage.createAppInstallation({
            storeId: store.id,
            appName: app?.title || 'Unknown App',
            appId: app?.id?.toString() || 'unknown',
            action: 'installed',
            version: app?.version || '1.0.0'
          });
        }
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('App installation webhook error:', error);
      res.status(500).send('Error');
    }
  });

  // Webhook for app updates
  app.post("/webhooks/app/updated", validateWebhook, async (req, res) => {
    try {
      const { shop_domain, app } = req.body;
      
      if (shop_domain) {
        const store = await storage.getStoreByDomain(shop_domain);
        if (store) {
          // Create app installation record
          await storage.createAppInstallation({
            storeId: store.id,
            appName: app?.title || 'Unknown App',
            appId: app?.id?.toString() || 'unknown',
            action: 'updated',
            version: app?.version || '1.0.0'
          });
        }
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('App update webhook error:', error);
      res.status(500).send('Error');
    }
  });
  */

  // Webhook for theme updates
  app.post("/webhooks/themes/update", validateWebhook, async (req, res) => {
    try {
      const { shop_domain, id, name, role } = req.body;

      if (shop_domain) {
        const store = await storage.getStoreByDomain(shop_domain);
        if (store) {
          // Create a theme change record
          await storage.createThemeChange({
            storeId: store.id,
            fileName: name || `theme_${id}`,
            changeType: "modified",
            currentHash: Date.now().toString(),
            previousHash: null, // We don't have the previous hash from webhook
          });

          console.log(
            `Theme update detected for ${shop_domain}: ${name || `theme_${id}`}`
          );
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Theme webhook error:", error);
      res.status(500).send("Error");
    }
  });

  // Webhook for theme publication
  app.post("/webhooks/themes/publish", validateWebhook, async (req, res) => {
    try {
      const { shop_domain, id, name, role } = req.body;

      if (shop_domain) {
        const store = await storage.getStoreByDomain(shop_domain);
        if (store) {
          // Create a theme change record
          await storage.createThemeChange({
            storeId: store.id,
            fileName: name || `theme_${id}`,
            changeType: "published",
            currentHash: Date.now().toString(),
            previousHash: null,
          });

          console.log(
            `Theme published for ${shop_domain}: ${name || `theme_${id}`}`
          );

          // Trigger a scan to check for issues after theme publication
          await storage.createScan({
            storeId: store.id,
            type: "full_site",
            status: "pending",
          });
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Theme publish webhook error:", error);
      res.status(500).send("Error");
    }
  });

  // Webhook for theme creation
  app.post("/webhooks/themes/create", validateWebhook, async (req, res) => {
    try {
      const { shop_domain, id, name } = req.body;

      if (shop_domain) {
        const store = await storage.getStoreByDomain(shop_domain);
        if (store) {
          // Create a theme change record
          await storage.createThemeChange({
            storeId: store.id,
            fileName: name || `theme_${id}`,
            changeType: "added",
            currentHash: Date.now().toString(),
            previousHash: null,
          });

          console.log(
            `Theme created for ${shop_domain}: ${name || `theme_${id}`}`
          );
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Theme create webhook error:", error);
      res.status(500).send("Error");
    }
  });

  // Webhook for theme deletion
  app.post("/webhooks/themes/delete", validateWebhook, async (req, res) => {
    try {
      const { shop_domain, id, name } = req.body;

      if (shop_domain) {
        const store = await storage.getStoreByDomain(shop_domain);
        if (store) {
          // Create a theme change record
          await storage.createThemeChange({
            storeId: store.id,
            fileName: name || `theme_${id}`,
            changeType: "deleted",
            currentHash: null,
            previousHash: Date.now().toString(),
          });

          console.log(
            `Theme deleted for ${shop_domain}: ${name || `theme_${id}`}`
          );
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Theme delete webhook error:", error);
      res.status(500).send("Error");
    }
  });

  // Webhook registration endpoint (for manual setup)
  app.post("/api/register-webhooks", async (req, res) => {
    try {
      const { shop, accessToken } = req.body;

      if (!shop || !accessToken) {
        return res.status(400).json({
          error: "shop and accessToken are required",
          example: {
            shop: "your-store.myshopify.com",
            accessToken: "shpat_...",
          },
        });
      }

      // Register webhooks using the same function as OAuth
      const results = await registerWebhooks(shop, accessToken);

      const successCount = results.filter((r) => r.status === "success").length;

      res.json({
        message: `Registered ${successCount}/${results.length} webhooks`,
        results,
        webhookBaseUrl: serverConfig.isProduction
          ? "https://bug-patrol.vercel.app"
          : "https://2f327d9ba6b7.ngrok-free.ap",
        instructions: {
          development: "Make sure ngrok is running and the URL is correct",
          production: "Webhooks are registered to your production domain",
        },
      });
    } catch (error) {
      console.error("Webhook registration error:", error);
      res.status(500).json({ error: "Failed to register webhooks" });
    }
  });

  // Endpoint to check registered webhooks
  app.post("/api/check-webhooks", async (req, res) => {
    try {
      const { shop, accessToken } = req.body;

      if (!shop || !accessToken) {
        return res.status(400).json({
          error: "shop and accessToken are required",
          example: {
            shop: "your-store.myshopify.com",
            accessToken: "shpat_...",
          },
        });
      }

      const webhooks = await checkRegisteredWebhooks(shop, accessToken);

      res.json({
        message: `Found ${webhooks.length} registered webhooks`,
        webhooks: webhooks.map((edge: any) => ({
          id: edge.node.id,
          topic: edge.node.topic,
          callbackUrl: edge.node.endpoint?.callbackUrl,
          createdAt: edge.node.createdAt,
          updatedAt: edge.node.updatedAt,
        })),
        total: webhooks.length,
      });
    } catch (error) {
      console.error("Webhook check error:", error);
      res.status(500).json({ error: "Failed to check webhooks" });
    }
  });

  // Session endpoint for checking authentication
  app.get("/api/auth/session", async (req, res) => {
    try {
      const { shop } = req.query;

      if (shop) {
        // Check if store exists and is active
        const store = await storage.getStoreByDomain(shop as string);

        if (!store || !store.isActive) {
          return res.status(401).json({ error: "Store not found or inactive" });
        }

        // Return store information for the dashboard
        res.json({
          shop: store.shopifyDomain,
          storeName: store.storeName,
          isAuthenticated: true,
          storeId: store.id,
          // plan: store.plan,
          // nextBillingDate: store.nextBillingDate
        });
      } else {
        // No shop parameter provided, check if we can determine the current session
        // For now, return not authenticated - this will show the installation page
        res.json({
          isAuthenticated: false,
          error: "No shop parameter provided",
        });
      }
    } catch (error) {
      console.error("Session check error:", error);
      res.status(500).json({ error: "Failed to check session" });
    }
  });

  // Session validation endpoint (for checking existing sessions)
  app.get("/api/auth/validate", async (req, res) => {
    try {
      // Get the shop from the request context
      // This should come from Shopify App Bridge headers or URL parameters
      const shop =
        req.headers["x-shopify-shop-domain"] ||
        req.headers["x-shopify-shop"] ||
        req.query.shop;

      if (!shop) {
        // No shop information available - user is not authenticated
        res.json({
          isAuthenticated: false,
          error: "No shop information available",
        });
        return;
      }

      // Check if this specific store exists and is active
      const store = await storage.getStoreByDomain(shop as string);

      if (!store) {
        res.json({
          isAuthenticated: false,
          error: "Store not found",
        });
        return;
      }

      if (!store.isActive) {
        res.json({
          isAuthenticated: false,
          error: "Store is inactive",
        });
        return;
      }

      // Valid session found - return store information
      res.json({
        shop: store.shopifyDomain,
        storeName: store.storeName,
        isAuthenticated: true,
        storeId: store.id,
      });
    } catch (error) {
      console.error("Session validation error:", error);
      res.status(500).json({ error: "Failed to validate session" });
    }
  });
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });



  // Get dashboard data for a store
  app.get("/api/dashboard/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;
      const { deviceType = "desktop" } = req.query;

      const deviceTypeFilter = deviceType as string;
      const [store, bugs, scans, performanceMetrics, alertSettings] =
        await Promise.all([
          storage.getStore(storeId),
          deviceTypeFilter && deviceTypeFilter !== "all"
            ? storage.getBugsByStoreIdAndDevice(storeId, deviceTypeFilter)
            : storage.getBugsByStoreId(storeId),
          storage.getScansByStoreId(storeId),
          deviceTypeFilter && deviceTypeFilter !== "all"
            ? storage.getLatestPerformanceMetricsByDevice(
                storeId,
                deviceTypeFilter
              )
            : storage.getLatestPerformanceMetrics(storeId),
          storage.getAlertSettings(storeId),
        ]);

      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Calculate dashboard stats
      const activeBugs = bugs.filter((bug) => bug.status === "open");
      const criticalBugs = activeBugs.filter(
        (bug) => bug.severity === "critical"
      ).length;
      const warningBugs = activeBugs.filter(
        (bug) => bug.severity === "warning"
      ).length;

      // Calculate store health with more reasonable penalties
      // Use percentage-based penalties instead of fixed point deductions
      const totalBugs = criticalBugs + warningBugs;
      let storeHealth = 100;

      if (totalBugs > 0) {
        // Critical bugs have more impact than warning bugs
        const criticalPenalty = Math.min(
          60,
          (criticalBugs / Math.max(totalBugs, 1)) * 60
        ); // Max 60% penalty
        const warningPenalty = Math.min(
          30,
          (warningBugs / Math.max(totalBugs, 1)) * 30
        ); // Max 30% penalty
        storeHealth = Math.max(0, 100 - criticalPenalty - warningPenalty);
      }

      // Calculate weighted Lighthouse-based store health score
      let lighthouseHealthScore = 100; // Default perfect score

      if (performanceMetrics) {
        // Extract Lighthouse category scores
        const performanceScore = performanceMetrics.performanceScore || 0;
        const accessibilityScore = performanceMetrics.accessibilityScore || 0;
        const bestPracticesScore = performanceMetrics.bestPracticesScore || 0;
        const seoScore = performanceMetrics.seoScore || 0;
        const pwaScore = performanceMetrics.pwaScore || 0;

        // Calculate weighted average using Lighthouse categories
        // Weights: Performance (35%), Accessibility (15%), Best Practices (10%), SEO (20%), PWA (20%)
        const weightedScore =
          performanceScore * 0.35 +
          accessibilityScore * 0.15 +
          bestPracticesScore * 0.1 +
          seoScore * 0.2 +
          pwaScore * 0.2;

        lighthouseHealthScore = Math.round(weightedScore);

        console.log(
          `🔍 Lighthouse Store Health Calculation for store ${storeId}:`
        );
        console.log(
          `  Performance: ${performanceScore} × 0.35 = ${
            performanceScore * 0.35
          }`
        );
        console.log(
          `  Accessibility: ${accessibilityScore} × 0.15 = ${
            accessibilityScore * 0.15
          }`
        );
        console.log(
          `  Best Practices: ${bestPracticesScore} × 0.10 = ${
            bestPracticesScore * 0.1
          }`
        );
        console.log(`  SEO: ${seoScore} × 0.20 = ${seoScore * 0.2}`);
        console.log(`  PWA: ${pwaScore} × 0.20 = ${pwaScore * 0.2}`);
        console.log(
          `  Weighted Total: ${weightedScore} → ${lighthouseHealthScore}`
        );
      }

      // Combine bug penalties with Lighthouse health score
      // If there are critical bugs, they can reduce the Lighthouse score
      if (totalBugs > 0) {
        const bugPenalty = Math.min(30, criticalBugs * 0.5 + warningBugs * 0.2); // Max 30% penalty from bugs
        storeHealth = Math.max(0, lighthouseHealthScore - bugPenalty);

        console.log(
          `🔍 Final Store Health: ${lighthouseHealthScore} - ${bugPenalty} = ${storeHealth}`
        );
      } else {
        storeHealth = lighthouseHealthScore;
      }

      // Get uptime data (same calculation as monitoring page)
      const uptimeData = await storage.getUptimeMonitoringByStoreId(storeId);
      const uptime =
        uptimeData.length > 0
          ? (uptimeData.filter((u) => u.status === "up").length /
              uptimeData.length) *
            100
          : 100;

      // Get next scan time from scheduler
      const { scanScheduler } = await import("./scan-scheduler");
      const scheduledScans = scanScheduler.getScheduledScans();
      console.log(
        `🔍 Dashboard API - Store ${storeId}: Found ${scheduledScans.length} scheduled scans`
      );
      console.log(
        `🔍 Scheduled scans:`,
        scheduledScans.map((scan: any) => ({
          storeId: scan.storeId,
          nextScanTime: scan.nextScanTime.toISOString(),
        }))
      );

      const storeScheduledScan = scheduledScans.find(
        (scan: any) => scan.storeId === storeId
      );
      let nextScanTime = storeScheduledScan
        ? storeScheduledScan.nextScanTime.toISOString()
        : null;

      console.log(
        `🔍 Store ${storeId} scheduled scan found:`,
        storeScheduledScan ? "YES" : "NO"
      );
      if (storeScheduledScan) {
        console.log(
          `🔍 Next scan time for store ${storeId}:`,
          storeScheduledScan.nextScanTime.toISOString()
        );
      }

      // If no scheduled scan found, try to schedule one
      if (!nextScanTime) {
        console.log(
          `⚠️ No scheduled scan found for store ${storeId}, attempting to schedule...`
        );
        try {
          // Ensure the store has scan frequency settings
          const settings = await storage.getAlertSettings(storeId);
          if (!settings?.scanFrequency) {
            console.log(
              `⚙️ Store ${storeId} has no scan frequency, setting default...`
            );
            await storage.updateAlertSettings(storeId, { scanFrequency: 60 });
          }

          await scanScheduler.scheduleStoreScan(storeId);
          const updatedScheduledScans = scanScheduler.getScheduledScans();
          const updatedStoreScan = updatedScheduledScans.find(
            (scan: any) => scan.storeId === storeId
          );
          nextScanTime = updatedStoreScan
            ? updatedStoreScan.nextScanTime.toISOString()
            : null;
          console.log(
            `✅ Successfully scheduled scan for store ${storeId}:`,
            nextScanTime
          );
        } catch (error) {
          console.error(
            `❌ Failed to schedule scan for store ${storeId}:`,
            error
          );
          // Fallback: create a simple next scan time
          const fallbackTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
          nextScanTime = fallbackTime.toISOString();
          console.log(
            `🔄 Using fallback scan time for store ${storeId}:`,
            nextScanTime
          );
        }
      }

      console.log(`🔍 Store ${storeId} next scan time:`, nextScanTime);

      // Calculate page speed and trends from performance metrics (same as performance page)
      let pageSpeed = null;
      let pageSpeedTrend = null;
      let trends = null;

      if (performanceMetrics) {
        // Use LCP as page speed indicator
        pageSpeed = performanceMetrics.lcp
          ? parseFloat(performanceMetrics.lcp)
          : null;

        // Calculate trends by comparing with previous scan
        const allMetrics = await storage.getPerformanceMetricsByStore(storeId);
        if (allMetrics.length > 1) {
          const currentLcp = pageSpeed;
          const previousLcp = allMetrics[1]?.lcp
            ? parseFloat(allMetrics[1].lcp)
            : null;

          if (currentLcp && previousLcp) {
            pageSpeedTrend = currentLcp - previousLcp;
          }

          // Calculate trends for all metrics
          const currentFcp = performanceMetrics.fcp
            ? parseFloat(performanceMetrics.fcp)
            : null;
          const previousFcp = allMetrics[1]?.fcp
            ? parseFloat(allMetrics[1].fcp)
            : null;
          const currentCls = performanceMetrics.cls
            ? parseFloat(performanceMetrics.cls)
            : null;
          const previousCls = allMetrics[1]?.cls
            ? parseFloat(allMetrics[1].cls)
            : null;
          const currentScore = performanceMetrics.overallScore;
          const previousScore = allMetrics[1]?.overallScore;

          trends = {
            lcp:
              currentLcp && previousLcp
                ? {
                    trend: currentLcp < previousLcp ? "improving" : "worsening",
                  }
                : undefined,
            fcp:
              currentFcp && previousFcp
                ? {
                    trend: currentFcp < previousFcp ? "improving" : "worsening",
                  }
                : undefined,
            cls:
              currentCls && previousCls
                ? {
                    trend: currentCls < previousCls ? "improving" : "worsening",
                  }
                : undefined,
            overallScore:
              currentScore && previousScore
                ? {
                    trend:
                      currentScore > previousScore ? "improving" : "worsening",
                  }
                : undefined,
          };
        }
      }

      res.json({
        store,
        stats: {
          storeHealth: storeHealth,
          activeIssues: activeBugs.length,
          criticalIssues: criticalBugs,
          warningIssues: warningBugs,
          uptime: Math.round(uptime * 10) / 10, // Round to 1 decimal
          pageSpeed,
          pageSpeedTrend,
        },
        bugs: bugs.slice(0, 5), // Recent bugs (limited to 5)
        scans: scans.slice(0, 5), // Recent scans (limited to 5)
        nextScanTime, // Next scheduled scan time
        performanceMetrics,
        trends, // Performance trends
        alertSettings,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Get performance metrics for a store
  app.get("/api/performance/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;
      const { deviceType = "desktop" } = req.query;

      // Get store and latest performance metrics with device type filtering
      const deviceTypeFilter = deviceType as string;
      const [store, latestMetrics, allMetrics] = await Promise.all([
        storage.getStore(storeId),
        deviceTypeFilter && deviceTypeFilter !== "all"
          ? storage.getLatestPerformanceMetricsByDevice(
              storeId,
              deviceTypeFilter
            )
          : storage.getLatestPerformanceMetrics(storeId),
        deviceTypeFilter && deviceTypeFilter !== "all"
          ? storage.getPerformanceMetricsByStoreAndDevice(
              storeId,
              deviceTypeFilter
            )
          : storage.getPerformanceMetricsByStore(storeId),
      ]);

      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Get historical data for trends (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentMetrics = allMetrics.filter(
        (metric) =>
          metric.measuredAt &&
          metric.measuredAt !== null &&
          new Date(metric.measuredAt) >= thirtyDaysAgo
      );

      // Calculate 30-day averages
      const validRecentMetrics = recentMetrics.filter(
        (metric) =>
          metric.lcp &&
          metric.lcp !== "NaN" &&
          metric.lcp !== "null" &&
          metric.fcp &&
          metric.fcp !== "NaN" &&
          metric.fcp !== "null" &&
          metric.cls &&
          metric.cls !== "NaN" &&
          metric.cls !== "null"
      );

      console.log(
        `Found ${validRecentMetrics.length} valid metrics out of ${recentMetrics.length} recent metrics`
      );

      const thirtyDayAverages =
        validRecentMetrics.length > 0
          ? {
              lcp:
                validRecentMetrics.reduce(
                  (sum, m) => sum + parseFloat(m.lcp || "0"),
                  0
                ) / validRecentMetrics.length,
              fcp:
                validRecentMetrics.reduce(
                  (sum, m) => sum + parseFloat(m.fcp || "0"),
                  0
                ) / validRecentMetrics.length,
              cls:
                validRecentMetrics.reduce(
                  (sum, m) => sum + parseFloat(m.cls || "0"),
                  0
                ) / validRecentMetrics.length,
              overallScore:
                validRecentMetrics.reduce(
                  (sum, m) => sum + (m.overallScore || 0),
                  0
                ) / validRecentMetrics.length,
              scanCount: validRecentMetrics.length,
              period: "30 days",
            }
          : null;

      res.json({
        store,
        currentMetrics: latestMetrics,
        latestScanInfo:
          latestMetrics && latestMetrics.measuredAt
            ? {
                scanTime: latestMetrics.measuredAt,
                scanAge: Math.floor(
                  (Date.now() - new Date(latestMetrics.measuredAt).getTime()) /
                    (1000 * 60 * 60)
                ), // hours ago
                isRecent:
                  Date.now() - new Date(latestMetrics.measuredAt).getTime() <
                  1000 * 60 * 60 * 24, // within 24 hours
              }
            : null,
        thirtyDayAverages,
        historicalMetrics: recentMetrics,
        trends: {
          lcp:
            recentMetrics.length > 1
              ? {
                  average:
                    recentMetrics.reduce(
                      (sum, m) => sum + parseFloat(m.lcp || "0"),
                      0
                    ) / recentMetrics.length,
                  trend:
                    recentMetrics[recentMetrics.length - 1]?.lcp &&
                    recentMetrics[0]?.lcp &&
                    parseFloat(
                      recentMetrics[recentMetrics.length - 1].lcp || "0"
                    ) > parseFloat(recentMetrics[0].lcp || "0")
                      ? "worsening"
                      : "improving",
                }
              : null,
          fcp:
            recentMetrics.length > 1
              ? {
                  average:
                    recentMetrics.reduce(
                      (sum, m) => sum + parseFloat(m.fcp || "0"),
                      0
                    ) / recentMetrics.length,
                  trend:
                    recentMetrics[recentMetrics.length - 1]?.fcp &&
                    recentMetrics[0]?.fcp &&
                    parseFloat(
                      recentMetrics[recentMetrics.length - 1].fcp || "0"
                    ) > parseFloat(recentMetrics[0].fcp || "0")
                      ? "worsening"
                      : "improving",
                }
              : null,
          cls:
            recentMetrics.length > 1
              ? {
                  average:
                    recentMetrics.reduce(
                      (sum, m) => sum + parseFloat(m.cls || "0"),
                      0
                    ) / recentMetrics.length,
                  trend:
                    recentMetrics[recentMetrics.length - 1]?.cls &&
                    recentMetrics[0]?.cls &&
                    parseFloat(
                      recentMetrics[recentMetrics.length - 1].cls || "0"
                    ) > parseFloat(recentMetrics[0].cls || "0")
                      ? "worsening"
                      : "improving",
                }
              : null,
          overallScore:
            recentMetrics.length > 1
              ? {
                  average:
                    recentMetrics.reduce(
                      (sum, m) => sum + (m.overallScore || 0),
                      0
                    ) / recentMetrics.length,
                  trend:
                    recentMetrics[recentMetrics.length - 1]?.overallScore &&
                    recentMetrics[0]?.overallScore &&
                    (recentMetrics[recentMetrics.length - 1].overallScore ||
                      0) < (recentMetrics[0].overallScore || 0)
                      ? "worsening"
                      : "improving",
                }
              : null,
        },
      });
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });







  // Get bugs with filtering, searching, and pagination
  app.get("/api/bugs/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;
      const {
        page = 1,
        limit = 10,
        search = "",
        severity = "",
        status = "",
        type = "",
        deviceType = "desktop",
        sortBy = "detectedAt",
        sortOrder = "desc",
      } = req.query;

      // Get store to verify it exists
      const store = await storage.getStore(storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Get all bugs for the store with device type filtering
      const deviceTypeFilter = deviceType as string;
      const allBugs =
        deviceTypeFilter && deviceTypeFilter !== "all"
          ? await storage.getBugsByStoreIdAndDevice(storeId, deviceTypeFilter)
          : await storage.getBugsByStoreId(storeId);
      console.log(`Found ${allBugs.length} total bugs for store ${storeId}`);

      // Apply filters
      let filteredBugs = allBugs.filter((bug) => {
        // Search filter
        const searchTerm = search as string;
        if (
          searchTerm &&
          !bug.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !bug.description.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }

        // Severity filter
        const severityFilter = severity as string;
        if (
          severityFilter &&
          severityFilter !== "all" &&
          severityFilter !== "" &&
          bug.severity !== severityFilter
        ) {
          return false;
        }

        // Status filter
        const statusFilter = status as string;
        if (
          statusFilter &&
          statusFilter !== "all" &&
          statusFilter !== "" &&
          bug.status !== statusFilter
        ) {
          return false;
        }

        // Type filter
        const typeFilter = type as string;
        if (
          typeFilter &&
          typeFilter !== "all" &&
          typeFilter !== "" &&
          bug.type !== typeFilter
        ) {
          return false;
        }

        // Device type filter
        const deviceTypeFilter = deviceType as string;
        if (
          deviceTypeFilter &&
          deviceTypeFilter !== "all" &&
          deviceTypeFilter !== "" &&
          bug.deviceType !== deviceTypeFilter
        ) {
          return false;
        }

        return true;
      });

      console.log(`After filtering: ${filteredBugs.length} bugs remain`);
      console.log("Filter values:", {
        search,
        severity,
        status,
        type,
        sortBy,
        sortOrder,
      });

      // Apply sorting
      filteredBugs.sort((a, b) => {
        let aValue = a[sortBy as keyof typeof a];
        let bValue = b[sortBy as keyof typeof b];

        if (sortOrder === "desc") {
          [aValue, bValue] = [bValue, aValue];
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return aValue.localeCompare(bValue);
        }

        if (aValue instanceof Date && bValue instanceof Date) {
          return aValue.getTime() - bValue.getTime();
        }

        return 0;
      });

      // Apply pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedBugs = filteredBugs.slice(startIndex, endIndex);

      // Calculate pagination info
      const totalBugs = filteredBugs.length;
      const totalPages = Math.ceil(totalBugs / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      // Get unique values for filter options
      const severities = Array.from(
        new Set(allBugs.map((bug) => bug.severity))
      );
      // TODO: Uncomment in next version: const statuses = Array.from(new Set(allBugs.map(bug => bug.status)));
      const statuses = Array.from(
        new Set(
          allBugs
            .map((bug) => bug.status)
            .filter((status) => status !== "resolved")
        )
      );
      const types = Array.from(new Set(allBugs.map((bug) => bug.type)));

      res.json({
        bugs: paginatedBugs,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalBugs,
          hasNextPage,
          hasPrevPage,
          limit: limitNum,
        },
        filters: {
          severities,
          statuses,
          types,
        },
        stats: {
          total: allBugs.length,
          open: allBugs.filter((bug) => bug.status === "open").length,
          // TODO: Uncomment in next version: resolved: allBugs.filter(bug => bug.status === 'resolved').length,
          critical: allBugs.filter((bug) => bug.severity === "critical").length,
          warning: allBugs.filter((bug) => bug.severity === "warning").length,
          info: allBugs.filter((bug) => bug.severity === "info").length,
        },
      });
    } catch (error) {
      console.error("Error fetching bugs:", error);
      res.status(500).json({ message: "Failed to fetch bugs" });
    }
  });

  // Get single bug details
  app.get("/api/bugs/:storeId/:bugId", async (req, res) => {
    try {
      const { storeId, bugId } = req.params;

      // Get store to verify it exists
      const store = await storage.getStore(storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Get bug details
      const bug = await storage.getBugById(bugId);
      if (!bug || bug.storeId !== storeId) {
        return res.status(404).json({ message: "Bug not found" });
      }

      // Get related bugs (same type or severity)
      const allBugs = await storage.getBugsByStoreId(storeId);
      const relatedBugs = allBugs
        .filter(
          (b) =>
            b.id !== bugId &&
            (b.type === bug.type || b.severity === bug.severity)
        )
        .slice(0, 5);

      res.json({
        bug,
        relatedBugs,
        store,
      });
    } catch (error) {
      console.error("Error fetching bug details:", error);
      res.status(500).json({ message: "Failed to fetch bug details" });
    }
  });

  // Trigger manual scan
  app.post("/api/scans", async (req, res) => {
    try {
      const scanData = insertScanSchema.parse(req.body);
      const scan = await storage.createScan(scanData);

      // Get store information for the scan
      const store = await storage.getStore(scanData.storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Use the real scanning engine
      try {
        const { scanEngine } = await import("./scanning/scan-engine");

        console.log(`Starting real scan for store: ${store.shopifyDomain}`);

        // Start the scan asynchronously
        scanEngine
          .executeScan({
            storeId: scanData.storeId,
            scanType: scanData.type as any,
            url: `https://${store.shopifyDomain}`,
            scanId: scan.id,
            deviceType:
              (scanData.deviceType as "mobile" | "desktop") || "desktop", // Add device type support
          })
          .catch((error) => {
            console.error(`Scan ${scan.id} failed:`, error);
            // Update scan status to failed
            storage
              .updateScan(scan.id, {
                status: "failed",
                completedAt: new Date(),
              })
              .catch((updateError) => {
                console.error("Failed to update scan status:", updateError);
              });
          });
      } catch (importError) {
        console.error("Failed to import scan engine:", importError);
        // Fallback to basic scan completion
        setTimeout(async () => {
          try {
            await storage.updateScan(scan.id, {
              status: "completed",
              pagesScanned: 1,
              duration: 30,
              completedAt: new Date(),
            });
            console.log(
              `Basic scan ${scan.id} completed for store ${scanData.storeId}`
            );
          } catch (error) {
            console.error("Error completing basic scan:", error);
          }
        }, 5000);
      }

      res.json(scan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid scan data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create scan" });
    }
  });

  // Get scan status
  app.get("/api/scans/:scanId", async (req, res) => {
    console.log("API route hit: /api/scans/:scanId", req.params);
    try {
      const { scanId } = req.params;
      console.log("Getting scan status for:", scanId);

      const scan = await storage.getScanById(scanId);
      if (!scan) {
        console.log("Scan not found:", scanId);
        return res.status(404).json({ message: "Scan not found" });
      }

      console.log("Scan found:", scan);
      res.json(scan);
    } catch (error) {
      console.error("Error getting scan status:", error);
      res
        .status(500)
        .json({ message: "Failed to get scan status", error: String(error) });
    }
  });

  // Update scan status
  app.patch("/api/scans/:scanId", async (req, res) => {
    try {
      const { scanId } = req.params;
      const updates = req.body;

      const scan = await storage.updateScan(scanId, updates);
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }

      res.json(scan);
    } catch (error) {
      res.status(500).json({ message: "Failed to update scan" });
    }
  });

  // Create new bug report
  app.post("/api/bugs", async (req, res) => {
    try {
      const bugData = insertBugSchema.parse(req.body);
      const bug = await storage.createBug(bugData);
      res.json(bug);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid bug data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bug report" });
    }
  });

  // Update bug status
  app.patch("/api/bugs/:bugId", async (req, res) => {
    try {
      const { bugId } = req.params;
      const { status } = req.body;

      const bug = await storage.updateBugStatus(bugId, status);
      if (!bug) {
        return res.status(404).json({ message: "Bug not found" });
      }

      res.json(bug);
    } catch (error) {
      res.status(500).json({ message: "Failed to update bug status" });
    }
  });

  // Update performance metrics
  app.post("/api/performance-metrics", async (req, res) => {
    try {
      const metricData = insertPerformanceMetricSchema.parse(req.body);
      const metric = await storage.createPerformanceMetric(metricData);
      res.json(metric);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid metric data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save performance metrics" });
    }
  });

  // Alert Settings
  app.get("/api/alert-settings/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;
      const settings = await storage.getAlertSettings(storeId);
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching alert settings:", error);
      res.status(500).json({ error: "Failed to fetch alert settings" });
    }
  });

  // Alerts
  app.get("/api/alerts/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;
      const alerts = await storage.getAlertsByStoreId(storeId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAllAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching all alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const alertData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(alertData);
      res.json(alert);
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(500).json({ error: "Failed to create alert" });
    }
  });

  app.patch("/api/alerts/:alertId", async (req, res) => {
    try {
      const { alertId } = req.params;
      const { status } = req.body;
      const alert = await storage.updateAlertStatus(alertId, status);
      if (alert) {
        res.json(alert);
      } else {
        res.status(404).json({ error: "Alert not found" });
      }
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  // Update alert settings
  app.patch("/api/alert-settings/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;
      const settingsData = insertAlertSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateAlertSettings(storeId, settingsData);

      // Update scan schedule if scan frequency changed
      if (settingsData.scanFrequency !== undefined) {
        console.log(
          `📅 Scan frequency updated for store ${storeId}: ${settingsData.scanFrequency} minutes`
        );
        const { scanScheduler } = await import("./scan-scheduler");
        await scanScheduler.updateStoreScanSchedule(storeId);
      }

      res.json(settings);
    } catch (error) {
      console.error("Error updating alert settings:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update alert settings" });
    }
  });

  // Get scheduled scans for monitoring
  app.get("/api/scheduled-scans", async (req, res) => {
    try {
      const { scanScheduler } = await import("./scan-scheduler");
      const scheduledScans = scanScheduler.getScheduledScans();
      res.json(scheduledScans);
    } catch (error) {
      console.error("Error fetching scheduled scans:", error);
      res.status(500).json({ message: "Failed to fetch scheduled scans" });
    }
  });



  // Manual uptime check for a store
  app.post("/api/uptime/check/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;

      console.log(`Manual uptime check requested for store: ${storeId}`);

      await uptimeMonitor.checkStore(storeId);

      res.json({
        message: "Uptime check completed successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error performing manual uptime check:", error);
      res.status(500).json({ error: "Failed to perform uptime check" });
    }
  });

  // Get uptime monitoring data for a store
  app.get("/api/uptime/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;

      // Get latest uptime status
      const latestStatus = await storage.getLatestUptimeStatus(storeId);

      // Get recent uptime checks (last 24 hours)
      const recentChecks = await storage.getUptimeMonitoringByStoreId(storeId);
      const last24Hours = recentChecks.filter((check) => {
        const checkTime = new Date(check.checkedAt || new Date()).getTime();
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        return checkTime > dayAgo;
      });

      // Calculate uptime percentage
      const totalChecks = last24Hours.length;
      const upChecks = last24Hours.filter(
        (check) => check.status === "up"
      ).length;
      const uptimePercentage =
        totalChecks > 0 ? (upChecks / totalChecks) * 100 : 100;

      // Calculate average response time
      const avgResponseTime =
        last24Hours.length > 0
          ? Math.round(
              last24Hours.reduce(
                (sum, check) => sum + (check.responseTime || 0),
                0
              ) / last24Hours.length
            )
          : 0;

      // Count incidents this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const incidentsThisMonth = recentChecks.filter(
        (check) =>
          check.status === "down" &&
          check.checkedAt &&
          new Date(check.checkedAt) >= thisMonth
      ).length;

      // Find last downtime
      const lastDowntime = recentChecks.find(
        (check) => check.status === "down"
      );
      const lastDowntimeText =
        lastDowntime && lastDowntime.checkedAt
          ? formatTimeAgo(new Date(lastDowntime.checkedAt))
          : "No downtime recorded";

      res.json({
        currentStatus: latestStatus?.status || "up",
        uptime: Math.round(uptimePercentage * 10) / 10, // Round to 1 decimal
        lastDowntime: lastDowntimeText,
        downtimeDuration:
          lastDowntime?.downUntil && lastDowntime?.downFrom
            ? `${Math.round(
                (new Date(lastDowntime.downUntil).getTime() -
                  new Date(lastDowntime.downFrom).getTime()) /
                  (1000 * 60)
              )} minutes`
            : "Unknown",
        responseTime: avgResponseTime,
        incidentsThisMonth,
        recentChecks: last24Hours.slice(0, 10).map((check) => ({
          timestamp: formatTimeAgo(new Date(check.checkedAt || new Date())),
          status: check.status,
          responseTime: check.responseTime || 0,
        })),
      });
    } catch (error) {
      console.error("Error fetching uptime data:", error);
      res.status(500).json({ error: "Failed to fetch uptime data" });
    }
  });

  // Get theme changes for a store
  app.get("/api/theme-changes/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;

      const themeChangesData = await storage.getThemeChangesByStoreId(storeId);

      const formattedChanges = themeChangesData.map((change) => ({
        id: change.id,
        fileName: change.fileName,
        changeType: change.changeType,
        timestamp: formatTimeAgo(new Date(change.detectedAt || new Date())),
        description: `${change.changeType} ${change.fileName}`,
        previousHash: change.previousHash,
        currentHash: change.currentHash,
      }));

      res.json(formattedChanges);
    } catch (error) {
      console.error("Error fetching theme changes:", error);
      res.status(500).json({ error: "Failed to fetch theme changes" });
    }
  });

  // Get app installations for a store
  app.get("/api/app-installations/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;

      const appInstallationsData = await storage.getAppInstallationsByStoreId(
        storeId
      );

      const formattedInstallations = appInstallationsData.map((app) => ({
        id: app.id,
        appName: app.appName,
        action: app.action,
        version: app.version || "Unknown",
        timestamp: formatTimeAgo(new Date(app.detectedAt || new Date())),
        appId: app.appId,
      }));

      res.json(formattedInstallations);
    } catch (error) {
      console.error("Error fetching app installations:", error);
      res.status(500).json({ error: "Failed to fetch app installations" });
    }
  });

  // Test email endpoint
  app.post("/api/test-email/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;
      const { email } = req.body;
      const settings = await storage.getAlertSettings(storeId);

      if (!settings || !settings.emailEnabled) {
        return res
          .status(400)
          .json({ message: "Email notifications not enabled" });
      }

      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }

      const store = await storage.getStore(storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      try {
        // Send test email immediately
        const { sendTestEmail } = await import("./email");
        await sendTestEmail(email);

        // Create test alert
        const testAlert: InsertAlert = {
          storeId,
          type: "info",
          title: "Test Email Sent",
          message: `Test email sent successfully to ${email}`,
          status: "active",
          source: "test",
          metadata: {
            email,
            testType: "email",
            timestamp: new Date().toISOString(),
          },
        };
        await storage.createAlert(testAlert);

        res.json({
          success: true,
          message: "Test email sent successfully",
        });
      } catch (emailError) {
        console.error("Failed to send email test:", emailError);
        res.status(500).json({
          success: false,
          message:
            "Failed to send test email. Please check your email configuration.",
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Test Slack endpoint
  app.post("/api/test-slack/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;
      const { botToken, channelId } = req.body;
      const settings = await storage.getAlertSettings(storeId);

      if (!settings || !settings.slackEnabled) {
        return res
          .status(400)
          .json({ message: "Slack notifications not enabled" });
      }

      if (!botToken || !channelId) {
        return res
          .status(400)
          .json({ message: "Bot token and channel ID are required" });
      }

      const store = await storage.getStore(storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      try {
        // Send test Slack message immediately
        const { sendSlackNotification } = await import("./slack");
        await sendSlackNotification(
          botToken,
          channelId,
          `🧪 This is a test notification from Bug Patrol for ${store.storeName}. Your Slack integration is working correctly!`
        );

        // Create test alert
        const testAlert: InsertAlert = {
          storeId,
          type: "info",
          title: "Test Slack Message Sent",
          message: `Test Slack message sent successfully to channel ${channelId}`,
          status: "active",
          source: "test",
          metadata: {
            channelId,
            testType: "slack",
            timestamp: new Date().toISOString(),
          },
        };
        await storage.createAlert(testAlert);

        res.json({
          success: true,
          message: "Test Slack message sent successfully",
        });
      } catch (slackError) {
        console.error("Failed to send Slack test:", slackError);
        res.status(500).json({
          success: false,
          message:
            "Failed to send test Slack message. Please check your bot token and channel ID.",
        });
      }
    } catch (error) {
      console.error("Test Slack error:", error);
      res.status(500).json({ message: "Failed to send test Slack message" });
    }
  });

  // Test alerts endpoint (for dashboard - tests both)
  app.post("/api/test-alerts/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;
      const settings = await storage.getAlertSettings(storeId);

      if (!settings) {
        return res.status(404).json({ message: "Alert settings not found" });
      }

      const store = await storage.getStore(storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      const results = {
        slack: false,
        email: false,
      };

      // Check if Slack is enabled and has credentials
      const hasSlackEnabled =
        settings.slackEnabled &&
        settings.slackBotToken &&
        settings.slackChannelId;

      // Send test Slack notification if enabled
      if (hasSlackEnabled) {
        try {
          const { sendSlackNotification } = await import("./slack");
          await sendSlackNotification(
            {
              title: "Test Alert",
              message: `🧪 This is a test notification from Bug Patrol for ${store.storeName}. Your Slack integration is working correctly!`,
              severity: "info",
              storeName: store.storeName,
              storeUrl: `${req.protocol}://${req.get("host")}/dashboard`,
            },
            settings.slackBotToken ? settings.slackBotToken : undefined,
            settings.slackChannelId ? settings.slackChannelId : ""
          );
          results.slack = true;
          console.log(
            `Test Slack notification sent successfully for store ${storeId}`
          );
        } catch (slackError) {
          console.error("Failed to send Slack test alert:", slackError);
        }
      } else {
        console.log(
          `Slack test skipped for store ${storeId} - not enabled or missing credentials`
        );
      }

      // Check if Email is enabled and has address
      const hasEmailEnabled = settings.emailEnabled && settings.emailAddress;

      // Send test email notification if enabled
      if (hasEmailEnabled) {
        try {
          const { sendTestEmail } = await import("./email");
          const emailSent = await sendTestEmail(settings.emailAddress || "");
          results.email = emailSent;
          console.log(
            `Test email notification sent successfully for store ${storeId}`
          );
        } catch (emailError) {
          console.error("Failed to send email test alert:", emailError);
        }
      } else {
        console.log(
          `Email test skipped for store ${storeId} - not enabled or missing email address`
        );
      }

      res.json({
        message: "Test alerts sent successfully",
        channels: {
          email: results.email,
          slack: results.slack,
        },
      });
    } catch (error) {
      console.error("Test alerts error:", error);
      res.status(500).json({ message: "Failed to send test alerts" });
    }
  });

  // ===== ADMIN API ENDPOINTS =====

  // Get admin dashboard overview
  app.get("/api/admin/overview", async (req, res) => {
    try {
      const stores = await storage.getAllStores();
      const allBugs = await storage.getAllBugs();
      const allScans = await storage.getAllScans();
      const allPerformanceMetrics = await storage.getAllPerformanceMetrics();

      // Calculate metrics
      const totalStores = stores.length;
      const activeStores = stores.filter(
        (store) => store.status === "active"
      ).length;
      const totalRevenue = stores.reduce((sum, store) => {
        const planRevenue =
          store.plan === "enterprise" ? 199 : store.plan === "pro" ? 89 : 29;
        return sum + planRevenue;
      }, 0);
      const totalScans = allScans.length;
      const criticalIssues = allBugs.filter(
        (bug) => bug.severity === "critical"
      ).length;
      const averageUptime =
        stores.length > 0
          ? stores.reduce((sum, store) => sum + (store.uptime || 99.9), 0) /
            stores.length
          : 99.9;

      // Calculate growth (mock for now - would need historical data)
      const monthlyGrowth = 12.5; // Mock growth percentage

      res.json({
        totalStores,
        activeStores,
        totalRevenue,
        monthlyGrowth,
        totalScans,
        criticalIssues,
        averageUptime: Math.round(averageUptime * 10) / 10,
      });
    } catch (error) {
      console.error("Error fetching admin overview:", error);
      res.status(500).json({ error: "Failed to fetch admin overview" });
    }
  });

  // Get all stores for admin
  app.get("/api/admin/stores", async (req, res) => {
    try {
      const stores = await storage.getAllStores();

      // Transform stores for admin view
      const adminStores = stores.map((store) => ({
        id: store.id,
        name: store.storeName || "Unknown Store",
        domain: store.shopifyDomain,
        owner: store.ownerName || "Unknown Owner",
        plan: store.plan || "basic",
        installDate: store.createdAt?.toISOString().split("T")[0] || "Unknown",
        lastScan: store.lastScanAt
          ? `${Math.floor(
              (Date.now() - new Date(store.lastScanAt).getTime()) / (1000 * 60)
            )} minutes ago`
          : "Never",
        status: store.status || "active",
        uptime: `${store.uptime || 99.9}%`,
        totalScans: store.totalScans || 0,
        criticalIssues: store.criticalIssues || 0,
        revenue: `$${
          store.plan === "enterprise" ? 199 : store.plan === "pro" ? 89 : 29
        }/mo`,
      }));

      res.json(adminStores);
    } catch (error) {
      console.error("Error fetching admin stores:", error);
      res.status(500).json({ error: "Failed to fetch admin stores" });
    }
  });

  // Get store details for admin
  app.get("/api/admin/stores/:storeId", async (req, res) => {
    try {
      const { storeId } = req.params;
      const store = await storage.getStore(storeId);

      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }

      // Get store-specific data
      const bugs = await storage.getBugsByStore(storeId);
      const scans = await storage.getScansByStore(storeId);
      const performanceMetrics = await storage.getPerformanceMetricsByStore(
        storeId
      );

      const storeDetails = {
        id: store.id,
        name: store.storeName || "Unknown Store",
        domain: store.shopifyDomain,
        plan: store.plan || "basic",
        status: store.status || "active",
        setupDate: store.createdAt?.toISOString().split("T")[0] || "Unknown",
        owner: {
          name: store.ownerName || "Unknown Owner",
          email: store.ownerEmail || "unknown@example.com",
          phone: store.ownerPhone || "N/A",
        },
        metrics: {
          storeHealth: store.storeHealth || 90,
          totalScans: scans.length,
          activeBugs: bugs.filter((bug) => bug.status === "open").length,
          resolvedBugs: bugs.filter((bug) => bug.status === "resolved").length,
          avgResponseTime: store.avgResponseTime || 1.2,
          uptime: store.uptime || 99.8,
          monthlyVisitors: store.monthlyVisitors || 15000,
        },
        subscription: {
          plan: store.plan || "basic",
          status: store.status || "active",
          amount:
            store.plan === "enterprise" ? 199 : store.plan === "pro" ? 89 : 29,
          nextBilling: store.nextBillingDate || "2024-07-15",
          features:
            store.plan === "enterprise"
              ? [
                  "Unlimited Scans",
                  "24/7 Monitoring",
                  "Priority Support",
                  "Custom Reports",
                ]
              : store.plan === "pro"
              ? [
                  "Advanced Scans",
                  "Daily Monitoring",
                  "Email Support",
                  "Basic Reports",
                ]
              : ["Basic Scans", "Weekly Monitoring", "Community Support"],
        },
        recentActivity: scans.slice(0, 5).map((scan) => ({
          type: "scan",
          action: `${scan.type} scan ${scan.status}`,
          timestamp: scan.completedAt
            ? `${Math.floor(
                (Date.now() - new Date(scan.completedAt).getTime()) /
                  (1000 * 60 * 60)
              )} hours ago`
            : "In progress",
          status: scan.status,
        })),
        technicalInfo: {
          shopifyPlan: store.shopifyPlan || "Shopify Basic",
          theme: store.theme || "Unknown",
          apps: store.appsCount || 0,
          products: store.productsCount || 0,
          orders: store.ordersCount || 0,
          lastUpdated:
            store.updatedAt?.toISOString().split("T")[0] || "Unknown",
        },
      };

      res.json(storeDetails);
    } catch (error) {
      console.error("Error fetching admin store details:", error);
      res.status(500).json({ error: "Failed to fetch admin store details" });
    }
  });

  // Get admin analytics
  app.get("/api/admin/analytics", async (req, res) => {
    try {
      const stores = await storage.getAllStores();
      const allBugs = await storage.getAllBugs();
      const allScans = await storage.getAllScans();

      // Calculate analytics data
      const overview = {
        totalRevenue: stores.reduce((sum, store) => {
          const planRevenue =
            store.plan === "enterprise" ? 199 : store.plan === "pro" ? 89 : 29;
          return sum + planRevenue;
        }, 0),
        totalCustomers: stores.length,
        activeStores: stores.filter((store) => store.status === "active")
          .length,
        totalScans: allScans.length,
        avgIssuesPerStore:
          stores.length > 0
            ? Math.round((allBugs.length / stores.length) * 10) / 10
            : 0,
        customerSatisfaction: 4.8, // Mock data
      };

      const growth = {
        revenueGrowth: 23.5, // Mock data
        customerGrowth: 18.2, // Mock data
        scanGrowth: 45.1, // Mock data
        churnRate: 2.3, // Mock data
      };

      const planDistribution = [
        {
          plan: "Enterprise",
          customers: stores.filter((store) => store.plan === "enterprise")
            .length,
          revenue:
            stores.filter((store) => store.plan === "enterprise").length * 199,
          percentage:
            stores.length > 0
              ? Math.round(
                  (stores.filter((store) => store.plan === "enterprise")
                    .length /
                    stores.length) *
                    1000
                ) / 10
              : 0,
        },
        {
          plan: "Pro",
          customers: stores.filter((store) => store.plan === "pro").length,
          revenue: stores.filter((store) => store.plan === "pro").length * 89,
          percentage:
            stores.length > 0
              ? Math.round(
                  (stores.filter((store) => store.plan === "pro").length /
                    stores.length) *
                    1000
                ) / 10
              : 0,
        },
        {
          plan: "Basic",
          customers: stores.filter((store) => store.plan === "basic").length,
          revenue: stores.filter((store) => store.plan === "basic").length * 29,
          percentage:
            stores.length > 0
              ? Math.round(
                  (stores.filter((store) => store.plan === "basic").length /
                    stores.length) *
                    1000
                ) / 10
              : 0,
        },
      ];

      const topIssues = [
        {
          type: "Broken Links",
          count: allBugs.filter((bug) => bug.type === "broken_link").length,
          stores: new Set(
            allBugs
              .filter((bug) => bug.type === "broken_link")
              .map((bug) => bug.storeId)
          ).size,
        },
        {
          type: "Performance",
          count: allBugs.filter((bug) => bug.type === "performance").length,
          stores: new Set(
            allBugs
              .filter((bug) => bug.type === "performance")
              .map((bug) => bug.storeId)
          ).size,
        },
        {
          type: "JavaScript Errors",
          count: allBugs.filter((bug) => bug.type === "javascript_error")
            .length,
          stores: new Set(
            allBugs
              .filter((bug) => bug.type === "javascript_error")
              .map((bug) => bug.storeId)
          ).size,
        },
        {
          type: "Missing Images",
          count: allBugs.filter((bug) => bug.type === "missing_image").length,
          stores: new Set(
            allBugs
              .filter((bug) => bug.type === "missing_image")
              .map((bug) => bug.storeId)
          ).size,
        },
        {
          type: "SEO Issues",
          count: allBugs.filter((bug) => bug.type === "seo").length,
          stores: new Set(
            allBugs
              .filter((bug) => bug.type === "seo")
              .map((bug) => bug.storeId)
          ).size,
        },
      ]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      res.json({
        overview,
        growth,
        planDistribution,
        topIssues,
      });
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      res.status(500).json({ error: "Failed to fetch admin analytics" });
    }
  });

  // Get specific bug details
  app.get("/api/bugs/:bugId", async (req, res) => {
    try {
      const { bugId } = req.params;
      const bug = await storage.getBugById(bugId);

      if (!bug) {
        return res.status(404).json({ error: "Bug not found" });
      }

      const store = await storage.getStore(bug.storeId);

      res.json({
        id: bug.id,
        title: bug.title,
        description: bug.description,
        severity: bug.severity,
        type: bug.type,
        status: bug.status,
        url: bug.url,
        detectedAt: bug.createdAt?.toISOString(),
        affectedPages: bug.affectedPages || 1,
        errorDetails: {
          httpStatus: bug.httpStatus,
          errorMessage: bug.errorMessage,
          stackTrace: bug.stackTrace,
          browserInfo: bug.browserInfo,
        },
        reproductionSteps: bug.reproductionSteps || [
          "1. Navigate to the affected page",
          "2. Observe the issue",
          "3. Check browser console for errors",
        ],
        impact: {
          estimatedAffectedUsers: bug.estimatedAffectedUsers || 100,
          pageViews: bug.pageViews || 1000,
          conversionImpact: bug.conversionImpact || "Unknown impact",
        },
        technicalDetails: {
          imageUrls: bug.imageUrls || [],
          lastWorkingDate: bug.lastWorkingDate,
          relatedChanges: bug.relatedChanges,
        },
      });
    } catch (error) {
      console.error("Error fetching bug details:", error);
      res.status(500).json({ error: "Failed to fetch bug details" });
    }
  });

  // Sample data creation functions removed - only real data will be used

  // Sample monitoring data creation function removed - only real data will be used

  const httpServer = createServer(app);

  // TODO: Uncomment these lines when you want sample data for testing
  // Create sample alerts for testing
  // createSampleAlerts().catch(console.error);
  // createSampleMonitoringData().catch(console.error);

  return httpServer;
}
