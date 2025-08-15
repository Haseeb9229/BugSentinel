import axios from "axios";

export interface PageSpeedResults {
  lcp: number;
  fcp: number;
  cls: number;
  overallScore: number;
  timeToInteractive: number;
  speedIndex: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  scanEngine?: "lighthouse" | "pagespeed";
  audits?: {
    opportunities: Array<{
      id: string;
      title: string;
      description: string;
      score: number;
      numericValue: number;
      displayValue: string;
      details?: any;
    }>;
    diagnostics: Array<{
      id: string;
      title: string;
      description: string;
      score: number;
      numericValue: number;
      displayValue: string;
      details?: any;
    }>;
    passedAudits: Array<{
      id: string;
      title: string;
      description: string;
      score: number;
    }>;
  };
}

export async function runPageSpeedAudit(
  url: string,
  deviceType: "mobile" | "desktop" = "desktop",
  apiKey?: string
): Promise<PageSpeedResults> {
  if (!apiKey) {
    throw new Error(
      "PageSpeed Insights API key is required. Get one from: https://developers.google.com/speed/docs/insights/v5/get-started"
    );
  }

  try {
    // PageSpeed Insights API v5
    const apiUrl = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

    const qs = new URLSearchParams();
    qs.append("url", url);
    qs.append("key", apiKey);
    qs.append("strategy", deviceType === "mobile" ? "mobile" : "desktop");
    ["performance", "accessibility", "best-practices", "seo"].forEach((c) =>
      qs.append("category", c)
    );

    const response = await axios.get(`${apiUrl}?${qs.toString()}`, {
      timeout: 60000,
    });

    const data = response.data;

    // Extract Core Web Vitals
    const lcp =
      data.lighthouseResult.audits["largest-contentful-paint"]?.numericValue ||
      0;
    const fcp =
      data.lighthouseResult.audits["first-contentful-paint"]?.numericValue || 0;
    const cls =
      data.lighthouseResult.audits["cumulative-layout-shift"]?.numericValue ||
      0;

    // Extract scores
    const performanceScore = Math.round(
      (data.lighthouseResult.categories.performance?.score || 0) * 100
    );
    const accessibilityScore = Math.round(
      (data.lighthouseResult.categories.accessibility?.score || 0) * 100
    );
    const bestPracticesScore = Math.round(
      (data.lighthouseResult.categories["best-practices"]?.score || 0) * 100
    );
    const seoScore = Math.round(
      (data.lighthouseResult.categories.seo?.score || 0) * 100
    );

    // Extract additional metrics
    const interactive =
      data.lighthouseResult.audits["interactive"]?.numericValue || 0;
    const speedIndex =
      data.lighthouseResult.audits["speed-index"]?.numericValue || 0;

    // Process audits for opportunities and diagnostics
    const audits = data.lighthouseResult.audits;
    const opportunities: Array<any> = [];
    const diagnostics: Array<any> = [];
    const passedAudits: Array<any> = [];

    Object.values(audits).forEach((audit: any) => {
      if (audit.score !== null && audit.score !== undefined) {
        const auditData = {
          id: audit.id,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          numericValue: audit.numericValue,
          displayValue: audit.displayValue,
          details: audit.details,
        };

        if (audit.score < 1 && audit.score >= 0.5) {
          opportunities.push(auditData);
        } else if (audit.score < 0.5) {
          diagnostics.push(auditData);
        } else if (audit.score === 1) {
          passedAudits.push(auditData);
        }
      }
    });
    console.log(lcp, fcp, cls, performanceScore, accessibilityScore, bestPracticesScore, seoScore);
    const results: PageSpeedResults = {
      lcp: parseFloat((lcp / 1000).toFixed(2)), // Convert to seconds
      fcp: parseFloat((fcp / 1000).toFixed(2)), // Convert to seconds
      cls: parseFloat(cls.toFixed(3)),
      overallScore: performanceScore,
      timeToInteractive: Math.round(interactive / 1000), // Convert to seconds
      speedIndex: Math.round(speedIndex / 1000), // Convert to seconds
      accessibility: accessibilityScore,
      bestPractices: bestPracticesScore,
      seo: seoScore,
      audits: {
        opportunities: opportunities.slice(0, 10),
        diagnostics: diagnostics.slice(0, 10),
        passedAudits: passedAudits.slice(0, 10),
      },
    };

    results.scanEngine = "pagespeed";

    console.log(
      `PageSpeed Insights completed for ${deviceType}: Score ${results.overallScore}, LCP=${results.lcp}s, FCP=${results.fcp}s, CLS=${results.cls}`
    );
    return results;
  } catch (error: any) {
    console.error(
      `PageSpeed Insights API error for ${deviceType}:`,
      error.message
    );

    // Add detailed error logging
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
      console.error(
        `Request URL: https://www.googleapis.com/pagespeedonline/v5/runPagespeed`
      );
      console.error(`Request params:`, {
        url,
        key: apiKey ? "***" : "MISSING",
      });
    }

    if (error.response?.status === 403) {
      throw new Error(
        "API key is invalid or quota exceeded. Check your PageSpeed Insights API key."
      );
    } else if (error.response?.status === 400) {
      throw new Error(
        `Invalid URL or parameters for PageSpeed Insights API. Status: ${
          error.response.status
        }, Data: ${JSON.stringify(error.response.data)}`
      );
    } else if (error.code === "ECONNABORTED") {
      throw new Error("PageSpeed Insights API request timed out.");
    }

    throw new Error(`PageSpeed Insights API failed: ${error.message}`);
  }
}
