# 🚀 PageSpeed Insights API Setup

## Why PageSpeed Insights API?

Your BugSentinel app now uses **Google's official PageSpeed Insights API** instead of local Lighthouse. This gives you:

✅ **Identical results** to the PageSpeed Insights web tool  
✅ **Google's official scoring algorithm**  
✅ **Real-world device emulation**  
✅ **Accurate Core Web Vitals** (LCP, FCP, CLS)  
✅ **No more "same results for mobile/desktop"**  

## 🔑 Get Your Free API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **PageSpeed Insights API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

## ⚙️ Configure Your App

### Option 1: Environment Variables (Recommended)
```bash
# Add to your .env file
PAGESPEED_API_KEY=your_api_key_here

# Choose your scan engine: 'lighthouse' or 'pagespeed'
SCAN_ENGINE=pagespeed
```

### Option 2: Direct in Code (Not recommended for production)
```typescript
// In config/environments.ts
export const serverConfig = {
  // ... other config
  pagespeedApiKey: 'your_api_key_here',
  scanEngine: 'pagespeed' // or 'lighthouse'
};
```

## 📊 What You'll Get Now

- **Real Performance Scores** - Same as PageSpeed Insights
- **Accurate Mobile vs Desktop** - Different results for each device
- **Core Web Vitals** - LCP, FCP, CLS with real values
- **Google's Scoring** - Official performance algorithm
- **Detailed Audits** - Opportunities, diagnostics, passed checks

## 🚨 Important Notes

- **API Quota**: Free tier includes 25,000 requests/day
- **Rate Limits**: 100 requests/100 seconds/user
- **Cost**: Free for most usage, $20 per 1000 requests after quota

## 🔍 Test Your Setup

1. Set your API key and scan engine
2. Restart the server
3. Run a scan
4. Compare results with [PageSpeed Insights](https://pagespeed.web.dev/)

Your results should now be **identical** to Google's tool! 🎯

## 🚀 Engine Selection

### PageSpeed Insights API (`SCAN_ENGINE=pagespeed`)
- ✅ **Identical results** to PageSpeed Insights web tool
- ✅ **Google's official scoring** algorithm
- ✅ **Real-world device emulation**
- ✅ **Requires API key** and has rate limits

### Lighthouse (`SCAN_ENGINE=lighthouse`)
- ✅ **Free and unlimited** scans
- ✅ **Runs locally** on your server
- ✅ **No API dependencies**
- ❌ **May differ** from PageSpeed Insights results
- ❌ **Requires Chrome** to be installed on server

### Automatic Fallback
If your primary engine fails, the system automatically tries the other engine to ensure scans complete successfully.
