import puppeteer from 'puppeteer';
import { URL } from 'url';

export interface JavaScriptError {
  message: string;
  source: string;
  line: number;
  column: number;
  stack?: string;
}

export interface CrawlResult {
  url: string;
  title: string;
  statusCode: number;
  loadTime: number;
  jsErrors: JavaScriptError[];
  consoleLogs: string[];
  pageSize: number;
  resourceCount: number;
  hasMetaDescription: boolean;
  hasTitle: boolean;
  missingAltTexts: number;
  totalImages: number;
  imageDetails: Array<{
    src: string;
    alt: string;
    width: number;
    height: number;
    displayWidth: number;
    displayHeight: number;
    position: { x: number; y: number };
    cssClasses: string;
    parentElement: string;
    context: string;
    isVisible: boolean;
  }>;
}

export interface CrawlIssue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  url: string;
  details?: any;
}

export async function crawlWebsite(baseUrl: string, maxPages: number = 10, deviceType: 'mobile' | 'desktop' = 'desktop'): Promise<{
  results: CrawlResult[];
  issues: CrawlIssue[];
  summary: {
    totalPages: number;
    totalErrors: number;
    avgLoadTime: number;
  };
}> {
  // Check if this is a Shopify development store
  const isShopifyDevStore = baseUrl.includes('.myshopify.com');
  let browser;
  
  try {

    
    // Launch browser with improved stability
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-field-trial-config',
        '--disable-ipc-flooding-protection',
        '--memory-pressure-off',
        '--max_old_space_size=4096'
      ]
    });

    const page = await browser.newPage();
    
    // Set device-specific configurations matching Google PageSpeed Insights
    if (deviceType === 'mobile') {
      // Mobile configuration (Pixel 5 - same as Lighthouse)
      await page.setUserAgent('Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36');
      await page.setViewport({ 
        width: 412, 
        height: 823, 
        deviceScaleFactor: 2.625, 
        isMobile: true, 
        hasTouch: true 
      });
      // Mobile configuration (Pixel 5 - same as Lighthouse)
      await page.setUserAgent('Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36');
      await page.setViewport({ 
        width: 412, 
        height: 823, 
        deviceScaleFactor: 2.625, 
        isMobile: true, 
        hasTouch: true 
      });
    } else {
      // Desktop configuration (high-end desktop)
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1350, height: 940 });
    }
    
    // Set device-specific throttling and timeouts matching Google's approach
    if (deviceType === 'mobile') {
      // Mobile: 3G network simulation
      await page.setDefaultNavigationTimeout(60000); // 60 seconds for mobile
      await page.setDefaultTimeout(60000);
      
      // Enable realistic mobile network throttling
      const client = await page.target().createCDPSession();
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1638 * 1024 / 8, // 3G speeds (1.638 Mbps)
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps upload
        latency: 150 // 150ms latency
      });
      
      // Add CPU throttling for mobile
      await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    } else {
      // Desktop: fast network simulation
      await page.setDefaultNavigationTimeout(45000); // 45 seconds
      await page.setDefaultTimeout(45000);
      
      // Enable realistic desktop network conditions
      const client = await page.target().createCDPSession();
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 10240 * 1024 / 8, // 10 Mbps download
        uploadThroughput: 5120 * 1024 / 8, // 5 Mbps upload
        latency: 40 // 40ms latency
      });
    }
    
    // Allow images but disable CSS and fonts for faster loading during crawl
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const results: CrawlResult[] = [];
    const urlsToVisit: string[] = [baseUrl];
    const visitedUrls = new Set<string>();
    const baseUrlObj = new URL(baseUrl);

    // Crawl pages
    while (urlsToVisit.length > 0 && results.length < maxPages) {
      const currentUrl = urlsToVisit.shift()!;
      
      if (visitedUrls.has(currentUrl)) {
        continue;
      }
      
      visitedUrls.add(currentUrl);
      
      try {

        const pageResult = await crawlPage(page, currentUrl);
        results.push(pageResult);
        
        // Extract more URLs from this page (if it's from the same domain)
        if (results.length < maxPages) {
          const newUrls = await extractLinks(page, baseUrlObj.host);
          for (const url of newUrls) {
            if (!visitedUrls.has(url) && !urlsToVisit.includes(url)) {
              urlsToVisit.push(url);
            }
          }
        }
        
      } catch (error) {
        console.error(`Error crawling ${currentUrl}:`, error);
        // Continue with other pages
      }
    }

    // If we're dealing with a Shopify dev store and got very few results, add fallback analysis
    if (isShopifyDevStore && results.length <= 2) {

      
      // Add basic analysis for the main page
      const mainPageResult = results.find(r => r.url === baseUrl);
      if (mainPageResult && mainPageResult.statusCode === 403) {
        // Create a fallback result for password-protected stores
        const fallbackResult: CrawlResult = {
          url: baseUrl,
          title: 'Shopify Development Store',
          statusCode: 200, // Treat as accessible for analysis
          loadTime: 0,
          jsErrors: [],
          consoleLogs: [],
          pageSize: 0,
          resourceCount: 0,
          hasMetaDescription: false,
          hasTitle: true,
          missingAltTexts: 0,
          totalImages: 0,
          imageDetails: []
        };
        
        // Replace the 403 result with fallback
        const index = results.findIndex(r => r.url === baseUrl);
        if (index !== -1) {
          results[index] = fallbackResult;
        }
      }
    }

      // Analyze results for issues
  const issues = analyzeCrawlIssues(results);

  // Add specific issue for password-protected Shopify stores
  if (isShopifyDevStore && results.length <= 2) {
    issues.push({
      type: 'accessibility',
      severity: 'info',
      title: 'Development Store Password Protection',
      description: 'This Shopify development store is password protected, limiting crawl access. Consider making the store public for comprehensive scanning.',
      url: baseUrl,
      details: {
        pagesAccessible: results.length,
        recommendation: 'Make store public or provide access credentials for full scanning'
      }
    });
  }
    
    // Calculate summary
    const summary = {
      totalPages: results.length,
      totalErrors: results.reduce((sum, r) => sum + r.jsErrors.length, 0),
      avgLoadTime: results.length > 0 ? 
        Math.round(results.reduce((sum, r) => sum + r.loadTime, 0) / results.length) : 0
    };

    return { results, issues, summary };

  } catch (error) {
    console.error('Website crawl error:', error);
    throw new Error(`Website crawl failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function crawlPage(page: puppeteer.Page, url: string): Promise<CrawlResult> {
  const jsErrors: JavaScriptError[] = [];
  const consoleLogs: string[] = [];
  let statusCode = 200;

  // Listen for JavaScript errors
  page.on('pageerror', error => {
    jsErrors.push({
      message: error.message,
      source: 'page',
      line: 0,
      column: 0,
      stack: error.stack
    });
  });

  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleLogs.push(`ERROR: ${msg.text()}`);
    }
  });

  // Listen for failed requests
  page.on('response', response => {
    if (response.status() >= 400) {
      statusCode = response.status();
    }
  });

  const startTime = Date.now();
  
  try {
    // Navigate to page
    const response = await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    statusCode = response?.status() || statusCode;
    
    // Check if we're redirected to a password page (common in Shopify dev stores)
    const currentUrl = page.url();
    if (currentUrl.includes('/password') || currentUrl.includes('/admin') || currentUrl.includes('/login')) {
      statusCode = 403; // Forbidden
    }
    
  } catch (error) {
    console.warn(`Navigation error for ${url}:`, error.message);
  }

  const loadTime = Date.now() - startTime;

  // Extract page information with detailed image analysis
  const pageInfo = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const imagesWithoutAlt = images.filter(img => !img.alt || img.alt.trim() === '');
    
    const imageDetails = imagesWithoutAlt.map(img => {
      const rect = img.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(img);
      
      return {
        src: img.src,
        alt: img.alt || '',
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0,
        displayWidth: rect.width,
        displayHeight: rect.height,
        position: {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY
        },
        cssClasses: img.className,
        parentElement: img.parentElement?.tagName || 'unknown',
        context: img.parentElement?.textContent?.substring(0, 100) || '',
        isVisible: rect.width > 0 && rect.height > 0 && computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden'
      };
    });

    return {
      title: document.title || '',
      hasMetaDescription: !!document.querySelector('meta[name="description"]'),
      missingAltTexts: imagesWithoutAlt.length,
      totalImages: images.length,
      imageDetails: imageDetails,
      resourceCount: performance.getEntriesByType('resource').length,
      pageSize: new Blob([document.documentElement.outerHTML]).size
    };
  });

  return {
    url,
    title: pageInfo.title,
    statusCode,
    loadTime,
    jsErrors,
    consoleLogs,
    pageSize: pageInfo.pageSize,
    resourceCount: pageInfo.resourceCount,
    hasMetaDescription: pageInfo.hasMetaDescription,
    hasTitle: !!pageInfo.title,
    missingAltTexts: pageInfo.missingAltTexts,
    totalImages: pageInfo.totalImages,
    imageDetails: pageInfo.imageDetails
  };
}

async function extractLinks(page: puppeteer.Page, baseDomain: string): Promise<string[]> {
  try {
    const links = await page.evaluate((domain) => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors
        .map(a => (a as HTMLAnchorElement).href)
        .filter(href => {
          // Only include links from the same domain
          if (!href.includes(domain)) return false;
          
          // Exclude admin pages and other sensitive areas
          const excludedPatterns = [
            '/admin',
            '/admin/',
            '/login',
            '/logout',
            '/checkout',
            '/cart',
            '/account',
            '/customer',
            '/password',
            '/recover',
            '/activate',
            '/reset',
            '/api/',
            '/_admin',
            '/_api',
            '/.well-known',
            '/robots.txt',
            '/sitemap.xml',
            '/favicon.ico'
          ];
          
          return !excludedPatterns.some(pattern => href.includes(pattern));
        })
        .slice(0, 20); // Limit to prevent infinite crawling
    }, baseDomain);
    
    return links;
  } catch (error) {
    console.warn('Error extracting links:', error);
    return [];
  }
}

function analyzeCrawlIssues(results: CrawlResult[]): CrawlIssue[] {
  const issues: CrawlIssue[] = [];

  // Analyze JavaScript errors
  const pagesWithJsErrors = results.filter(r => r.jsErrors.length > 0);
  if (pagesWithJsErrors.length > 0) {
    const totalJsErrors = pagesWithJsErrors.reduce((sum, r) => sum + r.jsErrors.length, 0);
    const criticalErrors = pagesWithJsErrors.filter(page => page.jsErrors.length > 3).length;
    
    issues.push({
      type: 'js_error',
      severity: totalJsErrors > 5 ? 'critical' : 'warning',
      title: 'JavaScript Errors Detected',
      description: `Found ${totalJsErrors} JavaScript errors across ${pagesWithJsErrors.length} pages`,
      url: pagesWithJsErrors[0].url,
      details: {
        affectedPages: pagesWithJsErrors.length,
        totalErrors: totalJsErrors,
        criticalPages: criticalErrors,
        errorBreakdown: {
          syntaxErrors: pagesWithJsErrors.reduce((sum, page) => 
            sum + page.jsErrors.filter(e => e.message.includes('SyntaxError')).length, 0),
          referenceErrors: pagesWithJsErrors.reduce((sum, page) => 
            sum + page.jsErrors.filter(e => e.message.includes('ReferenceError')).length, 0),
          typeErrors: pagesWithJsErrors.reduce((sum, page) => 
            sum + page.jsErrors.filter(e => e.message.includes('TypeError')).length, 0),
          otherErrors: totalJsErrors - pagesWithJsErrors.reduce((sum, page) => 
            sum + page.jsErrors.filter(e => 
              e.message.includes('SyntaxError') || 
              e.message.includes('ReferenceError') || 
              e.message.includes('TypeError')
            ).length, 0)
        },
        resources: pagesWithJsErrors.map(page => ({
          url: page.url,
          title: page.title || 'Untitled Page',
          errorCount: page.jsErrors.length,
          severity: page.jsErrors.length > 3 ? 'critical' : 'warning',
          errors: page.jsErrors.map(error => ({
            message: error.message,
            source: error.source,
            line: error.line,
            column: error.column,
            type: error.message.includes('SyntaxError') ? 'Syntax' : 
                  error.message.includes('ReferenceError') ? 'Reference' : 
                  error.message.includes('TypeError') ? 'Type' : 'Other'
          })),
          recommendations: [
            'Review and fix JavaScript syntax errors',
            'Check for undefined variables and functions',
            'Validate data types before operations',
            'Update deprecated JavaScript methods'
          ]
        })),
        overallRecommendations: [
          'Review and fix all JavaScript syntax errors',
          'Check for undefined variables and functions',
          'Validate data types before operations',
          'Update deprecated JavaScript methods',
          'Implement proper error handling',
          'Use ESLint for code quality checks'
        ]
      }
    });
  }

  // Analyze page load times
  const slowPages = results.filter(r => r.loadTime > 3000);
  if (slowPages.length > 0) {
    const totalLoadTime = slowPages.reduce((sum, r) => sum + r.loadTime, 0);
    const avgLoadTime = Math.round(totalLoadTime / slowPages.length);
    const potentialSavings = Math.round((avgLoadTime - 3000) * slowPages.length);
    
    issues.push({
      type: 'performance',
      severity: slowPages.length > results.length / 2 ? 'critical' : 'warning',
      title: 'Slow Loading Pages',
      description: `${slowPages.length} pages take longer than 3 seconds to load`,
      url: slowPages[0].url,
      details: {
        affectedPages: slowPages.length,
        avgLoadTime: avgLoadTime,
        totalLoadTime: totalLoadTime,
        potentialSavings: potentialSavings,
        threshold: 3000,
        recommendation: `Optimize ${slowPages.length} slow-loading pages to improve user experience`,
        resources: slowPages.map(page => ({
          url: page.url,
          title: page.title || 'Untitled Page',
          loadTime: page.loadTime,
          statusCode: page.statusCode,
          pageSize: page.pageSize,
          resourceCount: page.resourceCount,
          potentialSavings: Math.round(page.loadTime - 3000),
          recommendations: [
            'Optimize images and compress resources',
            'Implement lazy loading for non-critical content',
            'Use CDN for static assets',
            'Minimize HTTP requests'
          ]
        })),
        overallRecommendations: [
          'Implement image optimization and compression',
          'Use lazy loading for below-the-fold content',
          'Enable GZIP compression on server',
          'Minimize CSS and JavaScript files',
          'Use a CDN for static assets'
        ]
      }
    });
  }

  // Analyze SEO issues
  const pagesWithoutTitle = results.filter(r => !r.hasTitle);
  if (pagesWithoutTitle.length > 0) {
    const totalPages = results.length;
    const seoScore = Math.round(((totalPages - pagesWithoutTitle.length) / totalPages) * 100);
    
    issues.push({
      type: 'seo',
      severity: 'warning',
      title: 'Missing Page Titles',
      description: `${pagesWithoutTitle.length} pages are missing title tags`,
      url: pagesWithoutTitle[0].url,
      details: {
        affectedPages: pagesWithoutTitle.length,
        totalPages: totalPages,
        seoScore: seoScore,
        resources: pagesWithoutTitle.map(page => ({
          url: page.url,
          title: page.title || 'Untitled Page',
          hasTitle: page.hasTitle,
          hasMetaDescription: page.hasMetaDescription,
          impact: 'High - Critical for SEO and search engine visibility',
          recommendations: [
            'Add descriptive, unique title tags',
            'Include target keywords naturally',
            'Keep titles under 60 characters',
            'Make titles compelling for click-through rates'
          ]
        })),
        overallRecommendations: [
          'Implement automated title tag generation',
          'Use SEO plugins for title optimization',
          'Regular SEO audits and monitoring',
          'Create title tag templates for consistency',
          'Monitor search console for title performance'
        ],
        seoImpact: 'Missing titles severely hurt search engine rankings',
        userExperienceImpact: 'Browser tabs show generic titles, poor branding',
        searchVisibilityImpact: 'Pages may not appear in search results'
      }
    });
  }

  const pagesWithoutMeta = results.filter(r => !r.hasMetaDescription);
  if (pagesWithoutMeta.length > 0) {
    const totalPages = results.length;
    const metaScore = Math.round(((totalPages - pagesWithoutMeta.length) / totalPages) * 100);
    
    issues.push({
      type: 'seo',
      severity: 'info',
      title: 'Missing Meta Descriptions',
      description: `${pagesWithoutMeta.length} pages are missing meta descriptions`,
      url: pagesWithoutMeta[0].url,
      details: {
        affectedPages: pagesWithoutMeta.length,
        totalPages: totalPages,
        metaScore: metaScore,
        resources: pagesWithoutMeta.map(page => ({
          url: page.url,
          title: page.title || 'Untitled Page',
          hasTitle: page.hasTitle,
          hasMetaDescription: page.hasMetaDescription,
          impact: 'Medium - Affects search result snippets',
          recommendations: [
            'Add compelling meta descriptions',
            'Include primary keywords naturally',
            'Keep descriptions under 160 characters',
            'Write descriptions that encourage clicks'
          ]
        })),
        overallRecommendations: [
          'Create meta description templates',
          'Use SEO tools for description optimization',
          'Regular meta description audits',
          'A/B test different descriptions',
          'Monitor click-through rates in search console'
        ],
        seoImpact: 'Missing descriptions reduce click-through rates',
        userExperienceImpact: 'Search results show generic snippets',
        searchVisibilityImpact: 'Lower click-through rates affect rankings'
      }
    });
  }

      // Analyze accessibility issues
    const pagesWithMissingAlts = results.filter(r => r.missingAltTexts > 0);
    if (pagesWithMissingAlts.length > 0) {
      const totalMissingAlts = pagesWithMissingAlts.reduce((sum, r) => sum + r.missingAltTexts, 0);
      const totalPages = results.length;
      const accessibilityScore = totalPages > 0 ? Math.round(((totalPages - pagesWithMissingAlts.length) / totalPages) * 100) : 0;
      
      // Collect all image details from all pages
      const allImageDetails = pagesWithMissingAlts.flatMap(page => 
        page.imageDetails.map(img => ({
          ...img,
          pageUrl: page.url,
          pageTitle: page.title || 'Untitled Page'
        }))
      );
      

    
    issues.push({
      type: 'accessibility',
      severity: totalMissingAlts > 10 ? 'warning' : 'info',
      title: 'Missing Alt Text for Images',
      description: `Found ${totalMissingAlts} images without alt text across ${pagesWithMissingAlts.length} pages`,
      url: pagesWithMissingAlts[0].url,
      details: {
        affectedPages: pagesWithMissingAlts.length,
        totalMissing: totalMissingAlts,
        totalPages: totalPages,
        accessibilityScore: accessibilityScore,
        resources: pagesWithMissingAlts.map(page => ({
          url: page.url,
          title: page.title || 'Untitled Page',
          missingAltTexts: page.missingAltTexts,
          resourceCount: page.resourceCount || 0,
          impact: 'High - Screen readers cannot describe images to users',
          recommendations: [
            'Add descriptive alt text to all images',
            'Use empty alt="" for decorative images',
            'Include context and purpose in alt text',
            'Avoid generic terms like "image" or "photo"'
          ]
        })),
        imageDetails: allImageDetails.map(img => ({
          src: img.src,
          pageUrl: img.pageUrl,
          pageTitle: img.pageTitle,
          dimensions: `${img.width}x${img.height}px`,
          displaySize: `${img.displayWidth}x${img.displayHeight}px`,
          position: `(${Math.round(img.position.x)}, ${Math.round(img.position.y)})`,
          cssClasses: img.cssClasses,
          parentElement: img.parentElement,
          context: img.context,
          isVisible: img.isVisible,
          recommendations: [
            `Add descriptive alt text for this ${img.width}x${img.height} image`,
            img.isVisible ? 'This image is visible and needs alt text' : 'Consider if this decorative image needs alt=""',
            img.context ? `Context suggests: "${img.context.substring(0, 50)}..."` : 'Add context-appropriate alt text'
          ]
        })),
        overallRecommendations: [
          'Implement automated alt text generation',
          'Train content creators on accessibility',
          'Use accessibility testing tools',
          'Regular accessibility audits',
          'Include alt text in content guidelines',
          'Test with screen readers regularly'
        ],
        accessibilityImpact: 'Users with visual impairments cannot understand image content',
        seoImpact: 'Alt text helps search engines understand image content',
        complianceImpact: 'Missing alt text violates WCAG accessibility guidelines',
        userExperienceImpact: 'Screen reader users miss important visual information'
      }
    });
  }

  return issues;
}