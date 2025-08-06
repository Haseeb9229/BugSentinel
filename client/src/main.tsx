import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Get the host parameter from the URL
const urlParams = new URLSearchParams(window.location.search);
const host = urlParams.get('host') || '';
const shop = urlParams.get('shop') || '';

// Debug logging
console.log('URL Parameters:', { host, shop, fullUrl: window.location.href });

// Initialize Shopify App Bridge only when we have a valid host parameter from Shopify
// The host parameter should be provided by Shopify when the app is embedded
if (import.meta.env.VITE_SHOPIFY_API_KEY && host && host.includes('.myshopify.com')) {
  // Import and initialize App Bridge dynamically
  import('@shopify/app-bridge').then(({ createApp }) => {
    console.log('Initializing App Bridge with host:', host);
    
    const app = createApp({
      apiKey: import.meta.env.VITE_SHOPIFY_API_KEY,
      host: host,
      forceRedirect: true,
    });
    
    // Store the app instance globally for use in components
    (window as any).shopifyApp = app;
  });
} else {
  console.log('App Bridge not initialized - not in Shopify embedded context');
}

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
