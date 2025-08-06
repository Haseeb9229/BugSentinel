# Environment Variables Setup

## Email & Slack Notifications Configuration

Add these variables to your `.env` file to enable email and Slack notifications:

### Email Configuration (Choose ONE option)

#### Option 1: Gmail SMTP (Recommended for testing)
```env
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-gmail-app-password"
```

**How to get Gmail App Password:**
1. Go to your Google Account settings
2. Enable 2-factor authentication
3. Go to "Security" → "App passwords"
4. Generate a new app password for "Mail"
5. Use this password (not your regular Gmail password)

#### Option 2: SendGrid
```env
SENDGRID_API_KEY="your_sendgrid_api_key"
```

#### Option 3: Resend.com
```env
RESEND_API_KEY="your_resend_api_key"
```

### Slack Configuration

```env
SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
SLACK_CHANNEL_ID="C1234567890"
```

**How to get Slack credentials:**
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app or use existing one
3. Go to "OAuth & Permissions" → Copy the "Bot User OAuth Token"
4. Go to "Install App" → Install to your workspace
5. For Channel ID: Right-click on the channel → "Copy link" → Extract the ID from the URL

### Optional Configuration

```env
# Custom from email address
FROM_EMAIL="noreply@yourdomain.com"
```

## Testing Notifications

Once configured:
1. Go to Settings page in the app
2. Enable Email and/or Slack notifications
3. Click "Test Email" or "Test Slack" buttons
4. Check your email/Slack for test messages

## Features Enabled

- ✅ **Scan completion notifications** (email + Slack)
- ✅ **Critical issue alerts** (email + Slack)
- ✅ **Test notifications** from settings page
- ✅ **Beautiful HTML email templates**
- ✅ **Rich Slack messages with buttons** 