export const environments = {
  development: {
    appUrl: 'https://2f327d9ba6b7.ngrok-free.ap',
    shopifyAppUrl: 'https://2f327d9ba6b7.ngrok-free.ap'
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
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'sqlite:./data/bugsentinel.db',
  testMode: process.env.TEST_MODE === 'true',
  testWebsite: process.env.TEST_WEBSITE || 'https://example.com',
  // Add PageSpeed Insights API key
  pagespeedApiKey: process.env.PAGESPEED_API_KEY || '',
  // Scan engine selection: 'lighthouse' or 'pagespeed'
  scanEngine: process.env.SCAN_ENGINE || 'lighthouse',
  shopifyApiSecret: process.env.SHOPIFY_API_SECRET || '',
  shopifyApiKey: process.env.SHOPIFY_API_KEY || '',
  shopifyApiUrl: process.env.SHOPIFY_API_URL || '',
  shopifyApiVersion: process.env.SHOPIFY_API_VERSION || '',
  shopifyApiScope: process.env.SHOPIFY_API_SCOPE || '',
  isProduction: process.env.IS_PRODUCTION === 'true'
};