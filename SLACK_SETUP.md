# Slack Notifications Setup Guide

## 🚀 Quick Setup (Recommended - Webhook Method)

### Step 1: Create a Slack App
1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter app name: `Bug Patrol`
5. Select your workspace
6. Click **"Create App"**

### Step 2: Enable Incoming Webhooks
1. In your app settings, go to **"Incoming Webhooks"** in the left sidebar
2. Toggle **"Activate Incoming Webhooks"** to **ON**
3. Click **"Add New Webhook to Workspace"**
4. Choose the channel where you want to receive notifications
5. Click **"Allow"**
6. Copy the **Webhook URL** (looks like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`)

### Step 3: Add to Environment Variables
Add this to your `.env` file:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Step 4: Test Slack Notifications
1. Go to Settings page in your app
2. Enable **"Slack Notifications"**
3. Enter the webhook URL
4. Click **"Test Slack"**

---

## 🔧 Alternative Setup (Bot Token Method)

If you prefer using a bot token instead of webhooks:

### Step 1: Create Slack App (same as above)

### Step 2: Add Bot Token Scopes
1. Go to **"OAuth & Permissions"** in your app settings
2. Under **"Scopes"** → **"Bot Token Scopes"**, add:
   - `chat:write` (to send messages)
   - `chat:write.public` (to send to public channels)
3. Click **"Install to Workspace"**
4. Copy the **"Bot User OAuth Token"** (starts with `xoxb-`)

### Step 3: Add to Environment Variables
```env
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_CHANNEL_ID=C0123456789
```

### Step 4: Get Channel ID
1. Right-click on the channel in Slack
2. Select **"Copy link"**
3. The channel ID is the last part of the URL

---

## 🎯 What You'll Receive

### Test Messages
- **Test Alert**: "🧪 This is a test notification from Bug Patrol. Your Slack integration is working correctly!"

### Scan Completion Notifications
- **Success**: "✅ Scan completed for [Store Name] - Found X issues in Y seconds"
- **Critical**: "🚨 Critical issues detected - X issues found requiring attention"

### Critical Issue Alerts
- **Immediate alerts** for critical bugs and performance issues
- **Detailed information** about the problem
- **Direct links** to your dashboard

---

## 🔍 Troubleshooting

### "invalid_auth" Error
- Check that your webhook URL or bot token is correct
- Make sure the app is installed to your workspace
- Verify the bot has permission to post in the channel

### "channel_not_found" Error
- Check that the channel ID is correct
- Make sure the bot is invited to the channel
- Verify the bot has permission to access the channel

### Messages Not Appearing
- Check that notifications are enabled in your app settings
- Verify the webhook URL is active
- Make sure the bot token has the correct scopes

---

## 📝 Environment Variables Summary

For **Webhook Method** (Recommended):
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

For **Bot Token Method**:
```env
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_CHANNEL_ID=C0123456789
```

---

## 🎉 Next Steps

1. **Set up your Slack app** using the webhook method (easier)
2. **Add the webhook URL** to your `.env` file
3. **Restart your server** (`npm run dev`)
4. **Test the integration** in your app settings
5. **Run a scan** to see real notifications in action!

**Need help?** The webhook method is the easiest to set up and should work immediately once you add the URL to your `.env` file. 