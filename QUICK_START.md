# Bug Patrol - Quick Vercel Deployment

## 🚀 Quick Start (15 minutes)

Follow these steps to deploy Bug Patrol on Vercel with Dev/Staging/Production environments:

### Step 1: Prepare Repository (2 minutes)
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Bug Patrol Shopify App"

# Push to GitHub
git remote add origin https://github.com/yourusername/bug-patrol.git
git branch -M main
git push -u origin main

# Create environment branches
git checkout -b development
git push -u origin development
git checkout -b staging  
git push -u origin staging
git checkout main
```

### Step 2: Create Databases (3 minutes)
1. Go to [neon.tech](https://neon.tech)
2. Create 3 projects:
   - `bug-patrol-dev`
   - `bug-patrol-staging` 
   - `bug-patrol-prod`
3. Save connection strings for each

### Step 3: Create Shopify Apps (5 minutes)
1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Create 3 apps:
   - **Bug Patrol (Development)**
     - URL: `https://dev-bug-patrol.vercel.app`
     - Redirect: `https://dev-bug-patrol.vercel.app/auth/callback`
   - **Bug Patrol (Staging)**
     - URL: `https://staging-bug-patrol.vercel.app`
     - Redirect: `https://staging-bug-patrol.vercel.app/auth/callback`
   - **Bug Patrol (Production)**
     - URL: `https://bug-patrol.vercel.app`
     - Redirect: `https://bug-patrol.vercel.app/auth/callback`

### Step 4: Deploy to Vercel (5 minutes)
1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. **Don't deploy yet** - configure environments first
3. Go to Settings → Environment Variables
4. Add variables for each environment:

#### Development Environment (for "development" branch)
```env
NODE_ENV=development
DATABASE_URL=your_dev_neon_url
SHOPIFY_API_KEY=your_dev_shopify_key
SHOPIFY_API_SECRET=your_dev_shopify_secret
HOST=https://dev-bug-patrol.vercel.app
SLACK_BOT_TOKEN=your_slack_token
SLACK_CHANNEL_ID=your_dev_slack_channel
```

#### Staging Environment (for "staging" branch)
```env
NODE_ENV=staging
DATABASE_URL=your_staging_neon_url
SHOPIFY_API_KEY=your_staging_shopify_key
SHOPIFY_API_SECRET=your_staging_shopify_secret
HOST=https://staging-bug-patrol.vercel.app
SLACK_BOT_TOKEN=your_slack_token
SLACK_CHANNEL_ID=your_staging_slack_channel
```

#### Production Environment (for "main" branch)
```env
NODE_ENV=production
DATABASE_URL=your_prod_neon_url
SHOPIFY_API_KEY=your_prod_shopify_key
SHOPIFY_API_SECRET=your_prod_shopify_secret
HOST=https://bug-patrol.vercel.app
SLACK_BOT_TOKEN=your_slack_token
SLACK_CHANNEL_ID=your_prod_slack_channel
```

### Step 5: Deploy & Test
```bash
# Deploy development
git checkout development
git push origin development
# → Auto-deploys to dev-bug-patrol.vercel.app

# Deploy staging
git checkout staging
git merge development
git push origin staging
# → Auto-deploys to staging-bug-patrol.vercel.app

# Deploy production
git checkout main
git merge staging
git push origin main
# → Auto-deploys to bug-patrol.vercel.app
```

### Step 6: Test Installation
1. Create development stores in Shopify Partners
2. Install apps in each environment
3. Test OAuth flow: `https://dev-bug-patrol.vercel.app?shop=your-dev-store.myshopify.com`

## 🎯 What You Get

✅ **3 Environments**: Dev, Staging, Production
✅ **Automatic Deployments**: Push to branch = auto-deploy
✅ **Separate Databases**: Clean separation of data
✅ **Shopify Integration**: Ready for OAuth and App Bridge
✅ **Environment Variables**: Secure config management
✅ **Git Workflow**: Safe deployment pipeline

## 🔧 Development Workflow

```bash
# Work on features
git checkout development
# Make changes, commit, push
git push origin development

# Test on staging
git checkout staging
git merge development
git push origin staging

# Deploy to production
git checkout main
git merge staging
git push origin main
```

## 📱 Access URLs

- **Development**: https://dev-bug-patrol.vercel.app
- **Staging**: https://staging-bug-patrol.vercel.app  
- **Production**: https://bug-patrol.vercel.app

Each environment has its own:
- Database
- Shopify app credentials
- Slack channels
- Environment variables

This setup provides a professional deployment pipeline for safe testing and deployment of your Bug Patrol Shopify app!