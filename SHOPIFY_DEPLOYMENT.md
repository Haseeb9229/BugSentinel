# Bug Patrol - Shopify App Deployment Guide

## Overview
This guide covers deploying Bug Patrol as a public Shopify app, from development setup to App Store submission.

## Prerequisites
- Shopify Partner Account
- Domain for your app (for production)
- Replit Deployments or external hosting
- SSL certificate (required by Shopify)

## Step 1: Create Shopify App

### 1.1 Set up Partner Account
1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Create a Partner account if you don't have one
3. Navigate to "Apps" in the Partner Dashboard

### 1.2 Create New App
```bash
# In Partner Dashboard:
# 1. Click "Create app"
# 2. Choose "Public app" 
# 3. App name: "Bug Patrol - QA & Site Monitoring"
# 4. App URL: https://your-domain.replit.app (or your deployed URL)
# 5. Allowed redirection URLs: https://your-domain.replit.app/auth/callback
```

### 1.3 Required App Permissions (Scopes)
Add these scopes in your Partner Dashboard:
- `read_themes` - Monitor theme file changes
- `read_script_tags` - Inject monitoring scripts
- `read_products` - Scan product pages
- `read_orders` - Performance monitoring on checkout
- `read_analytics` - Access store performance data

## Step 2: Configure OAuth & App Bridge

### 2.1 Environment Variables
Add these to your Replit Secrets:
```env
SHOPIFY_API_KEY=your_api_key_from_partner_dashboard
SHOPIFY_API_SECRET=your_api_secret_from_partner_dashboard
SHOPIFY_SCOPES=read_themes,read_script_tags,read_products,read_orders,read_analytics
HOST=https://your-domain.replit.app
```

### 2.2 Update App Configuration
```typescript
// server/shopify-config.ts
export const shopifyConfig = {
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecret: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES!.split(','),
  hostName: process.env.HOST!.replace(/https?:\/\//, ''),
  isEmbeddedApp: true,
};
```

## Step 3: Implement OAuth Flow

### 3.1 Install Shopify Dependencies
```bash
npm install @shopify/shopify-api @shopify/app-bridge @shopify/app-bridge-react
```

### 3.2 Add OAuth Routes
```typescript
// server/auth.ts
import { Shopify } from '@shopify/shopify-api';

// OAuth initialization
app.get('/auth', (req, res) => {
  const authRoute = Shopify.Auth.beginAuth(
    req,
    res,
    req.query.shop as string,
    '/auth/callback',
    false // isOnline
  );
  res.redirect(authRoute);
});

// OAuth callback
app.get('/auth/callback', async (req, res) => {
  try {
    const session = await Shopify.Auth.validateAuthCallback(req, res, req.query);
    
    // Store session in database
    await storage.createStore({
      shopifyDomain: session.shop,
      accessToken: session.accessToken,
      isActive: true
    });
    
    // Redirect to embedded app
    res.redirect(`/?shop=${session.shop}&host=${req.query.host}`);
  } catch (error) {
    res.status(500).send('Authentication failed');
  }
});
```

### 3.3 Add App Bridge to Frontend
```typescript
// client/src/App.tsx
import { AppProvider } from '@shopify/app-bridge-react';

function App() {
  const config = {
    apiKey: import.meta.env.VITE_SHOPIFY_API_KEY,
    host: new URLSearchParams(location.search).get('host') || '',
    forceRedirect: true
  };

  return (
    <AppProvider config={config}>
      {/* Your existing app */}
    </AppProvider>
  );
}
```

## Step 4: Implement Real Scanning

### 4.1 Install Scanning Dependencies
```bash
npm install puppeteer lighthouse @google-chrome/lighthouse-ci broken-link-checker
```

### 4.2 Real Site Scanner
```typescript
// server/scanner.ts
import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';

export class ShopifyScanner {
  async scanStore(shopDomain: string) {
    const browser = await puppeteer.launch();
    const results = {
      performance: await this.runLighthouse(shopDomain),
      brokenLinks: await this.checkLinks(shopDomain),
      jsErrors: await this.detectJSErrors(shopDomain)
    };
    await browser.close();
    return results;
  }

  private async runLighthouse(url: string) {
    const result = await lighthouse(url, {
      onlyCategories: ['performance'],
      port: 9222
    });
    return result.lhr;
  }
}
```

### 4.3 Webhook Setup for Real-time Monitoring
```typescript
// server/webhooks.ts
app.post('/webhooks/themes/update', express.raw({type: 'application/json'}), (req, res) => {
  // Verify webhook with HMAC
  const hmac = crypto.createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET);
  const body = req.body;
  const hash = hmac.update(body, 'utf8').digest('base64');
  
  if (hash === req.get('X-Shopify-Hmac-Sha256')) {
    // Theme changed - trigger scan
    triggerScan(req.get('X-Shopify-Shop-Domain'));
  }
  
  res.status(200).send('OK');
});
```

## Step 5: Deploy to Production

### 5.1 Deploy on Replit
1. Go to your Replit project
2. Click "Deploy" button
3. Choose "Replit Deployments"
4. Your app will be available at: `https://your-project-name.replit.app`

### 5.2 Update Partner Dashboard
1. Return to Shopify Partner Dashboard
2. Update App URL to your deployed domain
3. Update redirection URLs
4. Add webhook endpoints

### 5.3 Production Environment
```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
SHOPIFY_API_KEY=your_production_api_key
SHOPIFY_API_SECRET=your_production_api_secret
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_CHANNEL_ID=your_slack_channel_id
```

## Step 6: Testing with Real Stores

### 6.1 Create Development Store
1. In Partner Dashboard, click "Stores"
2. Create development store
3. Install your app in this store
4. Test all functionality

### 6.2 Test Installation Flow
```bash
# Visit your app URL with test store:
https://your-deployed-app.replit.app?shop=your-test-store.myshopify.com

# This should:
# 1. Redirect to Shopify OAuth
# 2. Ask for permissions
# 3. Redirect back to your app
# 4. Show embedded app in Shopify admin
```

### 6.3 Test Real Scanning
1. Trigger manual scan from dashboard
2. Verify it scans actual store pages
3. Check performance metrics are real
4. Test Slack notifications

## Step 7: App Store Submission

### 7.1 Prepare App Listing
- App name: "Bug Patrol - QA & Site Monitoring"
- Tagline: "Automated QA monitoring and bug detection for Shopify stores"
- Description: Detailed explanation of features
- Screenshots: 5-8 high-quality screenshots
- App icon: 1024x1024px PNG

### 7.2 App Requirements Checklist
- ✅ HTTPS everywhere
- ✅ OAuth 2.0 implementation
- ✅ App Bridge integration
- ✅ GDPR compliance
- ✅ Webhook verification
- ✅ Error handling
- ✅ Performance optimization
- ✅ Mobile responsive design

### 7.3 Submit for Review
1. Complete app listing in Partner Dashboard
2. Add pricing information ($29/month Basic, $89/month Pro, $199/month Enterprise)
3. Submit for Shopify review
4. Review process takes 7-10 business days

## Step 8: Post-Launch

### 8.1 Monitor Performance
- Track app installations
- Monitor error rates
- Collect user feedback
- Watch performance metrics

### 8.2 Marketing
- Create landing page
- Write blog posts about QA automation
- Engage with Shopify community
- Partner with agencies

## Pricing Recommendation

### Basic Plan - $29/month
- Up to 100 pages scanned
- Daily monitoring
- Email alerts
- Basic performance metrics

### Pro Plan - $89/month  
- Up to 1,000 pages scanned
- Hourly monitoring
- Slack + email alerts
- Advanced analytics
- Theme change monitoring

### Enterprise - $199/month
- Unlimited scanning
- Real-time monitoring (15-minute intervals)
- Priority support
- Custom reports
- API access
- White-label options

## Support & Maintenance

### 8.3 Customer Support
- Set up help documentation
- Create support ticket system
- Monitor app reviews
- Provide email support

### 8.4 Ongoing Development
- Regular feature updates
- Security patches
- Performance improvements
- New monitoring capabilities

## Cost Structure

### Development Costs
- Lighthouse API: ~$0.02 per scan
- Server hosting: $50-200/month (Replit Pro)
- Database: $25-100/month
- Monitoring tools: $50/month

### Revenue Projections
- 100 customers × $89 average = $8,900/month
- 30% profit margin after costs
- Break-even at ~25 customers

This deployment guide will help you transition from demo to production-ready Shopify app. The app is already well-structured for this transition with its dual-portal architecture and comprehensive feature set.