import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

export interface LinkValidationResult {
  url: string;
  status: number;
  valid: boolean;
  redirected?: boolean;
  finalUrl?: string;
  error?: string;
}

export interface BrokenLinkIssue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  url: string;
  affectedLinks: number;
}

export async function validateLinks(baseUrl: string, maxLinks: number = 100): Promise<{
  results: LinkValidationResult[];
  issues: BrokenLinkIssue[];
}> {
  try {
    console.log(`Starting link validation for: ${baseUrl}`);
    
    // Fetch the main page
    const response = await axios.get(baseUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Bug Patrol Scanner/1.0'
      }
    });

    const $ = cheerio.load(response.data);
    const links: string[] = [];
    const baseUrlObj = new URL(baseUrl);

    // Extract all links
    $('a[href]').each((i, element) => {
      const href = $(element).attr('href');
      if (href && links.length < maxLinks) {
        try {
          let fullUrl: string;
          
          if (href.startsWith('http')) {
            fullUrl = href;
          } else if (href.startsWith('/')) {
            fullUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${href}`;
          } else if (href.startsWith('#')) {
            // Skip anchor links
            return;
          } else {
            fullUrl = new URL(href, baseUrl).toString();
          }
          
          // Avoid duplicates and external links for now
          if (fullUrl.includes(baseUrlObj.host) && !links.includes(fullUrl)) {
            links.push(fullUrl);
          }
        } catch (error) {
          // Invalid URL, will be caught as broken link
          links.push(href);
        }
      }
    });

    console.log(`Found ${links.length} links to validate`);

    // Validate each link
    const validationPromises = links.map(async (link): Promise<LinkValidationResult> => {
      try {
        const linkResponse = await axios.head(link, {
          timeout: 5000,
          maxRedirects: 5,
          headers: {
            'User-Agent': 'Bug Patrol Scanner/1.0'
          }
        });

        return {
          url: link,
          status: linkResponse.status,
          valid: linkResponse.status >= 200 && linkResponse.status < 400,
          redirected: linkResponse.request?.res?.responseUrl !== link,
          finalUrl: linkResponse.request?.res?.responseUrl
        };
      } catch (error: any) {
        return {
          url: link,
          status: error.response?.status || 0,
          valid: false,
          error: error.message
        };
      }
    });

    // Execute validations with concurrency limit
    const results: LinkValidationResult[] = [];
    const batchSize = 10;
    
    for (let i = 0; i < validationPromises.length; i += batchSize) {
      const batch = validationPromises.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      
      // Small delay to avoid overwhelming the server
      if (i + batchSize < validationPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Analyze results for issues
    const issues = analyzeLinkIssues(results, baseUrl);

    console.log(`Link validation completed. Found ${issues.length} issues`);
    return { results, issues };

  } catch (error) {
    console.error('Link validation error:', error);
    throw new Error(`Link validation failed: ${error.message}`);
  }
}

function analyzeLinkIssues(results: LinkValidationResult[], baseUrl: string): BrokenLinkIssue[] {
  const issues: BrokenLinkIssue[] = [];
  
  // Group results by status
  const brokenLinks = results.filter(r => !r.valid);
  const redirectedLinks = results.filter(r => r.redirected);
  
  if (brokenLinks.length > 0) {
    const criticalBroken = brokenLinks.filter(r => r.status === 404 || r.status === 0);
    const serverErrors = brokenLinks.filter(r => r.status >= 500);
    const clientErrors = brokenLinks.filter(r => r.status >= 400 && r.status < 500 && r.status !== 404);
    
    if (criticalBroken.length > 0) {
      const totalImpact = criticalBroken.reduce((sum, link) => sum + (link.error ? 1 : 0), 0);
      
      issues.push({
        type: 'broken_link',
        severity: 'critical',
        title: '404 and Missing Links Found',
        description: `Found ${criticalBroken.length} broken links that return 404 errors or fail to load`,
        url: baseUrl,
        affectedLinks: criticalBroken.length,
        details: {
          totalBrokenLinks: criticalBroken.length,
          errorBreakdown: {
            notFound: criticalBroken.filter(r => r.status === 404).length,
            connectionFailed: criticalBroken.filter(r => r.status === 0).length,
            timeoutErrors: criticalBroken.filter(r => r.error?.includes('timeout')).length,
            dnsErrors: criticalBroken.filter(r => r.error?.includes('ENOTFOUND')).length
          },
          resources: criticalBroken.map(link => ({
            url: link.url,
            status: link.status,
            error: link.error || 'Unknown error',
            type: link.status === 404 ? 'Not Found' : 
                  link.status === 0 ? 'Connection Failed' :
                  link.error?.includes('timeout') ? 'Timeout' :
                  link.error?.includes('ENOTFOUND') ? 'DNS Error' : 'Other',
            impact: 'High - User cannot access content',
            recommendations: [
              'Remove or update broken links',
              'Implement proper 404 error pages',
              'Set up redirects for moved content',
              'Check for typos in URLs'
            ]
          })),
          overallRecommendations: [
            'Audit all internal and external links regularly',
            'Implement automated link checking',
            'Set up proper redirects for moved content',
            'Create custom 404 error pages',
            'Monitor link health in analytics'
          ],
          seoImpact: 'Broken links negatively impact SEO and user experience',
          userExperienceImpact: 'Users encounter dead links and cannot access content'
        }
      });
    }
    
    if (serverErrors.length > 0) {
      issues.push({
        type: 'broken_link',
        severity: 'critical',
        title: 'Server Error Links',
        description: `Found ${serverErrors.length} links that return server errors (5xx status codes)`,
        url: baseUrl,
        affectedLinks: serverErrors.length,
        details: {
          totalServerErrors: serverErrors.length,
          errorBreakdown: {
            internalServerError: serverErrors.filter(r => r.status === 500).length,
            badGateway: serverErrors.filter(r => r.status === 502).length,
            serviceUnavailable: serverErrors.filter(r => r.status === 503).length,
            gatewayTimeout: serverErrors.filter(r => r.status === 504).length,
            otherServerErrors: serverErrors.filter(r => ![500, 502, 503, 504].includes(r.status)).length
          },
          resources: serverErrors.map(link => ({
            url: link.url,
            status: link.status,
            error: link.error || 'Server error',
            type: link.status === 500 ? 'Internal Server Error' :
                  link.status === 502 ? 'Bad Gateway' :
                  link.status === 503 ? 'Service Unavailable' :
                  link.status === 504 ? 'Gateway Timeout' : 'Other Server Error',
            impact: 'High - Server-side issues preventing access',
            recommendations: [
              'Contact the server administrator',
              'Check server logs for errors',
              'Implement proper error handling',
              'Set up monitoring for server health'
            ]
          })),
          overallRecommendations: [
            'Monitor server health and uptime',
            'Implement proper error handling and logging',
            'Set up automated server monitoring',
            'Have backup servers or CDN in place',
            'Regular server maintenance and updates'
          ],
          seoImpact: 'Server errors can cause search engines to deindex pages',
          userExperienceImpact: 'Users cannot access content due to server issues'
        }
      });
    }
    
    if (clientErrors.length > 0) {
      issues.push({
        type: 'broken_link',
        severity: 'warning',
        title: 'Client Error Links',
        description: `Found ${clientErrors.length} links that return client errors (4xx status codes)`,
        url: baseUrl,
        affectedLinks: clientErrors.length,
        details: {
          totalClientErrors: clientErrors.length,
          errorBreakdown: {
            badRequest: clientErrors.filter(r => r.status === 400).length,
            unauthorized: clientErrors.filter(r => r.status === 401).length,
            forbidden: clientErrors.filter(r => r.status === 403).length,
            methodNotAllowed: clientErrors.filter(r => r.status === 405).length,
            otherClientErrors: clientErrors.filter(r => ![400, 401, 403, 405].includes(r.status)).length
          },
          resources: clientErrors.map(link => ({
            url: link.url,
            status: link.status,
            error: link.error || 'Client error',
            type: link.status === 400 ? 'Bad Request' :
                  link.status === 401 ? 'Unauthorized' :
                  link.status === 403 ? 'Forbidden' :
                  link.status === 405 ? 'Method Not Allowed' : 'Other Client Error',
            impact: 'Medium - Access issues due to client-side problems',
            recommendations: [
              'Check URL format and parameters',
              'Verify authentication requirements',
              'Review access permissions',
              'Update request methods if needed'
            ]
          })),
          overallRecommendations: [
            'Review link construction and parameters',
            'Check authentication and authorization',
            'Verify API endpoints and methods',
            'Implement proper error handling',
            'Regular link validation testing'
          ],
          seoImpact: 'Client errors may indicate configuration issues',
          userExperienceImpact: 'Users may encounter access restrictions'
        }
      });
    }
  }
  
  if (redirectedLinks.length > 5) {
    issues.push({
      type: 'redirect',
      severity: 'warning',
      title: 'Multiple Redirected Links',
      description: `Found ${redirectedLinks.length} redirected links that could impact performance`,
      url: baseUrl,
      affectedLinks: redirectedLinks.length
    });
  }
  
  return issues;
}

export async function validateImages(baseUrl: string): Promise<{
  results: LinkValidationResult[];
  issues: BrokenLinkIssue[];
}> {
  try {
    console.log(`Starting image validation for: ${baseUrl}`);
    
    const response = await axios.get(baseUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Bug Patrol Scanner/1.0'
      }
    });

    const $ = cheerio.load(response.data);
    const images: string[] = [];
    const baseUrlObj = new URL(baseUrl);

    // Extract all image sources
    $('img[src]').each((i, element) => {
      const src = $(element).attr('src');
      if (src && images.length < 50) { // Limit to 50 images
        try {
          let fullUrl: string;
          
          if (src.startsWith('http')) {
            fullUrl = src;
          } else if (src.startsWith('/')) {
            fullUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${src}`;
          } else {
            fullUrl = new URL(src, baseUrl).toString();
          }
          
          if (!images.includes(fullUrl)) {
            images.push(fullUrl);
          }
        } catch (error) {
          images.push(src); // Will be caught as broken
        }
      }
    });

    console.log(`Found ${images.length} images to validate`);

    // Validate each image
    const results = await Promise.all(
      images.map(async (imageSrc): Promise<LinkValidationResult> => {
        try {
          const imageResponse = await axios.head(imageSrc, {
            timeout: 5000,
            headers: {
              'User-Agent': 'Bug Patrol Scanner/1.0'
            }
          });

          return {
            url: imageSrc,
            status: imageResponse.status,
            valid: imageResponse.status >= 200 && imageResponse.status < 400
          };
        } catch (error: any) {
          return {
            url: imageSrc,
            status: error.response?.status || 0,
            valid: false,
            error: error.message
          };
        }
      })
    );

    // Analyze image issues
    const brokenImages = results.filter(r => !r.valid);
    const issues: BrokenLinkIssue[] = [];
    
    if (brokenImages.length > 0) {
      const totalImages = results.length;
      const workingImages = totalImages - brokenImages.length;
      const imageSuccessRate = Math.round((workingImages / totalImages) * 100);
      
      issues.push({
        type: 'missing_image',
        severity: 'critical',
        title: 'Broken Images Found',
        description: `Found ${brokenImages.length} images that fail to load or return errors`,
        url: baseUrl,
        affectedLinks: brokenImages.length,
        details: {
          totalImages: totalImages,
          brokenImages: brokenImages.length,
          workingImages: workingImages,
          successRate: imageSuccessRate,
          errorBreakdown: {
            notFound: brokenImages.filter(r => r.status === 404).length,
            serverErrors: brokenImages.filter(r => r.status >= 500).length,
            connectionFailed: brokenImages.filter(r => r.status === 0).length,
            timeoutErrors: brokenImages.filter(r => r.error?.includes('timeout')).length,
            dnsErrors: brokenImages.filter(r => r.error?.includes('ENOTFOUND')).length
          },
          resources: brokenImages.map(image => ({
            url: image.url,
            status: image.status,
            error: image.error || 'Unknown error',
            type: image.status === 404 ? 'Image Not Found' : 
                  image.status === 0 ? 'Connection Failed' :
                  image.status >= 500 ? 'Server Error' :
                  image.error?.includes('timeout') ? 'Timeout' :
                  image.error?.includes('ENOTFOUND') ? 'DNS Error' : 'Other',
            impact: 'High - Visual content missing, poor user experience',
            recommendations: [
              'Upload missing images to server',
              'Check image file paths and URLs',
              'Optimize image file sizes',
              'Use proper image formats (WebP, AVIF)',
              'Implement lazy loading for images'
            ]
          })),
          overallRecommendations: [
            'Regular image audit and validation',
            'Implement automated image optimization',
            'Use CDN for image delivery',
            'Set up proper image backup systems',
            'Monitor image loading performance',
            'Implement progressive image loading',
            'Use responsive images with srcset'
          ],
          seoImpact: 'Missing images hurt SEO and user engagement',
          userExperienceImpact: 'Users see broken image placeholders instead of content',
          performanceImpact: 'Broken images can cause layout shifts and slow page loads'
        }
      });
    }

    console.log(`Image validation completed. Found ${issues.length} issues`);
    return { results, issues };

  } catch (error) {
    console.error('Image validation error:', error);
    throw new Error(`Image validation failed: ${error.message}`);
  }
}