# Shopify Integration Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Shopify App Configuration
VITE_SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here

# Database Configuration
DATABASE_URL=your_neon_database_url_here

# Slack Integration (Optional)
SLACK_BOT_TOKEN=your_slack_bot_token_here
SLACK_CHANNEL_ID=your_slack_channel_id_here

# Environment
NODE_ENV=development

# Server Configuration
PORT=5000
HOST=http://localhost:5000
```

## Shopify App Setup

### 1. Create a Shopify Partner Account
- Go to [partners.shopify.com](https://partners.shopify.com)
- Create a new partner account if you don't have one

### 2. Create a New App
- In your partner dashboard, click "Apps" → "Create app"
- Choose "Public app"
- Fill in the app details:
  - App name: "BugSentinel"
  - App URL: `http://localhost:5000` (for development)
  - Allowed redirection URLs: `http://localhost:5000/auth/callback`

### 3. Configure App Settings
- Go to "App setup" in your app dashboard
- Copy the API key and API secret key
- Add them to your `.env` file

### 4. Configure App Scopes
The scopes will be requested during the OAuth flow when merchants install your app. The required scopes are:
- `read_products`
- `read_themes`
- `read_analytics`
- `read_orders`
- `read_customers`

These will be automatically requested when a store owner installs your app.

### 5. Configure Webhooks
Add these webhooks:
- **App uninstalled**: `http://localhost:5000/webhooks/app/uninstalled`
- **Theme update**: `http://localhost:5000/webhooks/themes/update`

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Database
```bash
npm run db:push
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Test OAuth Flow
1. Create a development store in your Shopify Partner account
2. Install your app on the development store
3. During installation, Shopify will show the required permissions (scopes)
4. The store owner will approve the permissions
5. The OAuth flow should automatically redirect to your app

## Production Deployment

### 1. Update Environment Variables
For production, update the URLs in your `.env`:
```env
HOST=https://your-app-domain.com
```

### 2. Update Shopify App Settings
- Update the App URL to your production domain
- Update the Allowed redirection URLs to `https://your-app-domain.com/auth/callback`
- Update webhook URLs to your production domain

### 3. Deploy to Vercel
Follow the deployment instructions in `QUICK_START.md`

## Testing the Integration

### 1. OAuth Flow Test
- Visit: `http://localhost:5000/auth?shop=your-dev-store.myshopify.com`
- Should redirect to Shopify OAuth
- After authorization, should redirect back to your app

### 2. Embedded App Test
- Install the app on a development store
- Should open in the Shopify admin interface
- All functionality should work within the embedded context

### 3. Webhook Test
- Uninstall the app from a development store
- Check that the store is marked as inactive in your database

## Troubleshooting

### Common Issues

1. **OAuth Redirect Error**
   - Ensure the redirect URL in Shopify app settings matches exactly
   - Check that the API key and secret are correct

2. **App Bridge Not Loading**
   - Verify that `VITE_SHOPIFY_API_KEY` is set correctly
   - Check browser console for errors

3. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Run `npm run db:push` to ensure tables exist

4. **Webhook Not Receiving**
   - Use ngrok for local development: `ngrok http 5000`
   - Update webhook URLs in Shopify app settings
   - Check server logs for webhook errors

### Debug Mode
Add this to your `.env` for detailed logging:
```env
DEBUG=shopify:*
``` 