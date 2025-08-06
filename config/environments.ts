export const environments = {
  development: {
    appUrl: 'https://a94717a6db99.ngrok-free.app',
    shopifyAppUrl: 'https://a94717a6db99.ngrok-free.app'
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

export const serverConfig = {
  port: process.env.PORT || 5000,
  shopifyApiKey: process.env.SHOPIFY_API_KEY || '',
  shopifyApiSecret: process.env.SHOPIFY_API_SECRET || '',
  databaseUrl: process.env.DATABASE_URL || '',
  slackBotToken: process.env.SLACK_BOT_TOKEN || '',
  slackChannelId: process.env.SLACK_CHANNEL_ID || '',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isStaging: process.env.NODE_ENV === 'staging',
  testMode: process.env.TEST_MODE === 'true',
  testWebsite: process.env.TEST_WEBSITE || 'https://creativesproutmedia.com/'
};