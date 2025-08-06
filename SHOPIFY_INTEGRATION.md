# Shopify Integration Guide for Bug Patrol

## Overview

Bug Patrol is designed as a **Shopify Public App** that integrates directly into the Shopify ecosystem. This document explains how the app works, how merchants install it, and how to deploy it for real Shopify stores.

## Current Architecture

### What You Have Built

1. **Store Owner Dashboard** - The main interface for store owners to monitor their site health
2. **Admin Panel** - For managing multiple store installations (app developer view)
3. **Database Schema** - Stores data for multiple Shopify stores
4. **API Backend** - Handles store data, scanning, and reporting

### App Type: Public Shopify App

This is built as a **Public Shopify App**, which means:
- Multiple merchants can install it from the Shopify App Store
- Each installation creates a new store record in your database
- The app operates across many different Shopify stores
- You (the developer) manage the infrastructure for all stores

## How Merchants Install and Use the App

### 1. App Store Discovery
- Merchants discover Bug Patrol in the **Shopify App Store**
- They see the app listing with features, pricing, and reviews
- Click "Add app" to begin installation

### 2. OAuth Installation Flow
```
1. Merchant clicks "Add app" on app store listing
2. Redirected to your app with shop parameter: yourapp.com/auth?shop=store.myshopify.com
3. Your app initiates OAuth flow with required permissions:
   - read_products (to scan product pages)
   - read_themes (to detect theme changes)
   - read_analytics (for performance data)
4. Merchant approves permissions
5. Shopify sends access token to your app
6. Your app creates store record in database
7. Merchant is redirected to embedded dashboard
```

### 3. Embedded Dashboard Experience
- Dashboard embeds directly in Shopify Admin using **Shopify App Bridge**
- Merchant sees Bug Patrol as a native part of their Shopify admin
- All functionality (scans, reports, settings) works within Shopify interface

## Technical Implementation for Real Shopify Integration

### Required Changes for Production

#### 1. Shopify App Bridge Integration
```typescript
// Add to client/src/main.tsx
import { AppProvider } from '@shopify/app-bridge';

const config = {
  apiKey: import.meta.env.VITE_SHOPIFY_API_KEY,
  host: new URLSearchParams(location.search).get('host') || '',
  forceRedirect: true,
};

// Wrap App component
<AppProvider config={config}>
  <App />
</AppProvider>
```

#### 2. OAuth Authentication Endpoints
```typescript
// Add to server/routes.ts
app.get('/auth', async (req, res) => {
  const { shop } = req.query;
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${CLIENT_ID}&scope=${SCOPES}&redirect_uri=${REDIRECT_URI}`;
  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { code, shop } = req.query;
  // Exchange code for access token
  // Create store record in database
  // Redirect to embedded app
});
```

#### 3. Webhook Handlers
```typescript
// Monitor store changes
app.post('/webhooks/app/uninstalled', (req, res) => {
  // Handle app uninstallation
  // Deactivate store in database
});

app.post('/webhooks/themes/update', (req, res) => {
  // Trigger scan when theme changes
});
```

#### 4. Environment Variables Needed
```
SHOPIFY_API_KEY=your_app_api_key
SHOPIFY_API_SECRET=your_app_secret
SHOPIFY_SCOPES=read_products,read_themes,read_analytics
HOST=https://your-app-domain.com
```

## Testing with Shopify

### Development Store Testing
1. **Create Shopify Partner Account**: partners.shopify.com
2. **Create Development Store**: Test store for app development
3. **Create App in Partner Dashboard**: Get API credentials
4. **Install App**: Test OAuth flow and embedded experience
5. **Test Functionality**: Ensure all features work in real Shopify environment

### App Store Submission Process
1. **Complete App Development**: All features working
2. **App Store Review**: Submit for Shopify review
3. **Compliance Check**: Meets Shopify's quality standards
4. **Public Listing**: Available for all merchants

## Deployment Architecture

### Current Demo vs Production

**Current (Demo Mode)**:
- Single demo store with hardcoded data
- No OAuth flow
- No Shopify App Bridge
- No real store scanning

**Production Ready**:
- Multi-tenant (supports many stores)
- OAuth authentication
- Embedded in Shopify Admin
- Real website scanning
- Webhook monitoring
- App Store distribution

### Infrastructure Requirements
- **Database**: PostgreSQL (already implemented)
- **Background Jobs**: For automated scanning every 60 minutes
- **Queue System**: Handle multiple store scans
- **Webhook Processing**: Real-time store updates
- **SSL Certificate**: Required for Shopify apps
- **Domain**: Stable domain for app URL

## Revenue Model
- **Subscription Plans**: Basic, Pro, Enterprise
- **Shopify Billing API**: Handle recurring charges
- **Free Trial**: 14-day trial period
- **Usage-based**: Additional charges for premium features

## Next Steps for Real Shopify Integration

1. **Set up Shopify Partner Account**
2. **Add Shopify App Bridge to frontend**
3. **Implement OAuth authentication flow**
4. **Add webhook handlers**
5. **Build real website scanning functionality**
6. **Set up background job processing**
7. **Deploy to production environment**
8. **Submit to Shopify App Store**

The current app provides an excellent foundation and demo of the core functionality that store owners would experience after installation.