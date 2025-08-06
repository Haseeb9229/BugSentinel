# Bug Patrol - Vercel Deployment Guide

## Overview
This guide covers deploying Bug Patrol on Vercel with proper Dev/Staging/Production environment management and Shopify integration.

## Prerequisites
- GitHub account
- Vercel account
- Shopify Partner account
- Neon PostgreSQL accounts (3 databases for each environment)

## Step 1: Prepare Project for Vercel

### 1.1 Create Vercel Configuration
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/**/*",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 1.2 Update Package.json Scripts
```json
// Add to package.json scripts
{
  "build": "npm run build:client && npm run build:server",
  "build:client": "vite build",
  "build:server": "esbuild server/index.ts --bundle --platform=node --target=node18 --outfile=dist/server.js",
  "vercel-build": "npm run build",
  "start": "node dist/server.js"
}
```

### 1.3 Create Environment-Specific Configs
```typescript
// config/environments.ts
export const environments = {
  development: {
    appUrl: 'http://localhost:5000',
    shopifyAppUrl: 'https://dev-bug-patrol.vercel.app'
  },
  staging: {
    appUrl: 'https://staging-bug-patrol.vercel.app',
    shopifyAppUrl: 'https://staging-bug-patrol.vercel.app'
  },
  production: {
    appUrl: 'https://bug-patrol.vercel.app',
    shopifyAppUrl: 'https://bug-patrol.vercel.app'
  }
};

export const getEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  return environments[env as keyof typeof environments];
};
```

## Step 2: Set Up GitHub Repository

### 2.1 Initialize Git Repository
```bash
# In your project directory
git init
git add .
git commit -m "Initial commit: Bug Patrol Shopify App"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/bug-patrol.git
git branch -M main
git push -u origin main
```

### 2.2 Create Environment Branches
```bash
# Create development branch
git checkout -b development
git push -u origin development

# Create staging branch  
git checkout -b staging
git push -u origin staging

# Return to main (production)
git checkout main
```

## Step 3: Create Neon Databases

### 3.1 Development Database
1. Go to [neon.tech](https://neon.tech)
2. Create new project: "bug-patrol-dev"
3. Copy connection string
4. Save as: `DATABASE_URL_DEV`

### 3.2 Staging Database
1. Create new project: "bug-patrol-staging"
2. Copy connection string
3. Save as: `DATABASE_URL_STAGING`

### 3.3 Production Database
1. Create new project: "bug-patrol-prod"
2. Copy connection string
3. Save as: `DATABASE_URL_PROD`

## Step 4: Set Up Shopify Apps for Each Environment

### 4.1 Development Shopify App
1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Create app: "Bug Patrol (Development)"
3. App URL: `https://dev-bug-patrol.vercel.app`
4. Redirect URLs: `https://dev-bug-patrol.vercel.app/auth/callback`
5. Save API Key and Secret as: `SHOPIFY_API_KEY_DEV`, `SHOPIFY_API_SECRET_DEV`

### 4.2 Staging Shopify App
1. Create app: "Bug Patrol (Staging)"
2. App URL: `https://staging-bug-patrol.vercel.app`
3. Redirect URLs: `https://staging-bug-patrol.vercel.app/auth/callback`
4. Save API Key and Secret as: `SHOPIFY_API_KEY_STAGING`, `SHOPIFY_API_SECRET_STAGING`

### 4.3 Production Shopify App
1. Create app: "Bug Patrol"
2. App URL: `https://bug-patrol.vercel.app`
3. Redirect URLs: `https://bug-patrol.vercel.app/auth/callback`
4. Save API Key and Secret as: `SHOPIFY_API_KEY_PROD`, `SHOPIFY_API_SECRET_PROD`

## Step 5: Deploy to Vercel

### 5.1 Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Import your bug-patrol repository
4. **Do not deploy yet** - we need to configure environments first

### 5.2 Create Development Deployment
1. In Vercel dashboard, go to your project
2. Go to Settings → Domains
3. Add custom domain: `dev-bug-patrol.vercel.app`
4. Go to Settings → Environment Variables
5. Add development environment variables:

```env
# Development Environment Variables
NODE_ENV=development
DATABASE_URL=your_dev_database_url
SHOPIFY_API_KEY=your_dev_shopify_api_key
SHOPIFY_API_SECRET=your_dev_shopify_api_secret
SHOPIFY_SCOPES=read_themes,read_script_tags,read_products,read_orders,read_analytics
HOST=https://dev-bug-patrol.vercel.app
SLACK_BOT_TOKEN=your_slack_token
SLACK_CHANNEL_ID=your_dev_slack_channel
```

6. Set these variables for "Development" branches (development branch)

### 5.3 Create Staging Deployment
1. Add custom domain: `staging-bug-patrol.vercel.app`
2. Add staging environment variables for "Preview" branches (staging branch):

```env
# Staging Environment Variables
NODE_ENV=staging
DATABASE_URL=your_staging_database_url
SHOPIFY_API_KEY=your_staging_shopify_api_key
SHOPIFY_API_SECRET=your_staging_shopify_api_secret
SHOPIFY_SCOPES=read_themes,read_script_tags,read_products,read_orders,read_analytics
HOST=https://staging-bug-patrol.vercel.app
SLACK_BOT_TOKEN=your_slack_token
SLACK_CHANNEL_ID=your_staging_slack_channel
```

### 5.4 Create Production Deployment
1. Add custom domain: `bug-patrol.vercel.app` (or your custom domain)
2. Add production environment variables for "Production" branch (main branch):

```env
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=your_prod_database_url
SHOPIFY_API_KEY=your_prod_shopify_api_key
SHOPIFY_API_SECRET=your_prod_shopify_api_secret
SHOPIFY_SCOPES=read_themes,read_script_tags,read_products,read_orders,read_analytics
HOST=https://bug-patrol.vercel.app
SLACK_BOT_TOKEN=your_slack_token
SLACK_CHANNEL_ID=your_prod_slack_channel
```

## Step 6: Configure Branch Deployments

### 6.1 Vercel Branch Settings
In Vercel project settings:
1. Go to Settings → Git
2. Configure branch deployments:
   - `main` branch → Production (bug-patrol.vercel.app)
   - `staging` branch → Preview (staging-bug-patrol.vercel.app)
   - `development` branch → Development (dev-bug-patrol.vercel.app)

### 6.2 Deployment Workflow
```bash
# Development workflow
git checkout development
# Make changes
git add .
git commit -m "feat: new feature"
git push origin development
# Auto-deploys to dev-bug-patrol.vercel.app

# Staging workflow  
git checkout staging
git merge development
git push origin staging
# Auto-deploys to staging-bug-patrol.vercel.app

# Production workflow
git checkout main
git merge staging
git push origin main
# Auto-deploys to bug-patrol.vercel.app
```

## Step 7: Database Migrations for Each Environment

### 7.1 Development Database Setup
```bash
# Set development database URL
export DATABASE_URL="your_dev_database_url"
npm run db:push
```

### 7.2 Staging Database Setup
```bash
# Set staging database URL
export DATABASE_URL="your_staging_database_url"
npm run db:push
```

### 7.3 Production Database Setup
```bash
# Set production database URL
export DATABASE_URL="your_prod_database_url"
npm run db:push
```

## Step 8: Create Development and Staging Stores

### 8.1 Development Store
1. In Shopify Partners, create development store: "Bug Patrol Dev Store"
2. Install your development app
3. Test URL: `https://dev-bug-patrol.vercel.app?shop=bug-patrol-dev-store.myshopify.com`

### 8.2 Staging Store
1. Create development store: "Bug Patrol Staging Store"
2. Install your staging app
3. Test URL: `https://staging-bug-patrol.vercel.app?shop=bug-patrol-staging-store.myshopify.com`

### 8.3 Production Store (when ready)
1. Create production store or use real merchant store
2. Install production app
3. Live URL: `https://bug-patrol.vercel.app?shop=real-store.myshopify.com`

## Step 9: Testing Strategy

### 9.1 Development Testing
- Test new features and bug fixes
- Experiment with UI changes
- Test database migrations
- Debug issues in safe environment

### 9.2 Staging Testing
- Integration testing
- Performance testing
- User acceptance testing
- Final testing before production

### 9.3 Production Monitoring
- Real user data
- Performance monitoring
- Error tracking
- Customer feedback

## Step 10: Environment-Specific Configuration

### 10.1 Update Server Configuration
```typescript
// server/config.ts
import { getEnvironment } from '../config/environments';

const env = getEnvironment();

export const serverConfig = {
  port: process.env.PORT || 5000,
  host: env.appUrl,
  shopifyApiKey: process.env.SHOPIFY_API_KEY!,
  shopifyApiSecret: process.env.SHOPIFY_API_SECRET!,
  databaseUrl: process.env.DATABASE_URL!,
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isStaging: process.env.NODE_ENV === 'staging'
};
```

### 10.2 Update Client Configuration
```typescript
// client/src/config/environment.ts
export const clientConfig = {
  apiUrl: import.meta.env.VITE_API_URL || '',
  shopifyApiKey: import.meta.env.VITE_SHOPIFY_API_KEY || '',
  environment: import.meta.env.MODE,
  isDevelopment: import.meta.env.MODE === 'development',
  isStaging: import.meta.env.MODE === 'staging',
  isProduction: import.meta.env.MODE === 'production'
};
```

## Step 11: Deployment Commands

### 11.1 Deploy Development
```bash
git checkout development
git add .
git commit -m "feat: development changes"
git push origin development
# Vercel auto-deploys to dev-bug-patrol.vercel.app
```

### 11.2 Deploy Staging
```bash
git checkout staging
git merge development
git push origin staging
# Vercel auto-deploys to staging-bug-patrol.vercel.app
```

### 11.3 Deploy Production
```bash
git checkout main
git merge staging
git push origin main
# Vercel auto-deploys to bug-patrol.vercel.app
```

## Step 12: Monitoring and Maintenance

### 12.1 Vercel Analytics
- Enable Vercel Analytics for all environments
- Monitor performance and usage
- Track deployment success rates

### 12.2 Database Monitoring
- Monitor Neon database usage
- Set up alerts for connection limits
- Regular backup verification

### 12.3 Error Tracking
- Implement error logging
- Set up Slack alerts for production errors
- Monitor user feedback

## Cost Breakdown

### Vercel Costs
- Pro Plan: $20/month (for custom domains and team features)
- Bandwidth: ~$0.40/GB
- Function executions: Generous free tier

### Neon Database Costs
- Free tier: 0.5GB storage, 1 database
- Pro: $19/month per database (3 databases = $57/month)

### Shopify Development
- Partner account: Free
- Development stores: Free
- App Store fees: 20% revenue share (only for paid apps)

## Next Steps After Deployment

1. **Test OAuth flow** in all environments
2. **Verify database connections** work properly
3. **Test Slack notifications** in each environment
4. **Perform end-to-end testing** on staging
5. **Deploy to production** when staging tests pass
6. **Monitor production** performance and errors

This setup gives you a professional deployment pipeline with proper environment separation, allowing you to safely test features before they reach production customers.