import { useState, useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnboardingAnimation } from "@/components/onboarding/onboarding-animation";
import { useShopifyAuth } from "@/hooks/use-shopify-auth";
import { ShopifyProvider } from "@/components/shopify/shopify-provider";
import Dashboard from "@/pages/dashboard";
import BugReports from "@/pages/bug-reports";
import Performance from "@/pages/performance";
import Monitoring from "@/pages/monitoring";
import Admin from "@/pages/admin";
import AdminCustomers from "@/pages/admin/customers";
import AdminCustomerDetail from "@/pages/admin/customer-detail";
import AdminStores from "@/pages/admin/stores";
import AdminStoreDetail from "@/pages/admin/store-detail";
import AdminScans from "@/pages/admin/scans";
import AdminScanDetail from "@/pages/admin/scan-detail";
import AdminRevenue from "@/pages/admin/revenue";
import AdminSubscriptions from "@/pages/admin/subscriptions";
import AdminSubscriptionDetail from "@/pages/admin/subscription-detail";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminLogs from "@/pages/admin/logs";
import BugDetail from "@/pages/bug-detail";
import Alerts from "@/pages/alerts";
import AllAlerts from "@/pages/all-alerts";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/bugs" component={BugReports} />
      <Route path="/performance" component={Performance} />
      <Route path="/monitoring" component={Monitoring} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/customers/:customerId" component={AdminCustomerDetail} />
      <Route path="/admin/stores" component={AdminStores} />
      <Route path="/admin/stores/:storeId" component={AdminStoreDetail} />
      <Route path="/admin/scans" component={AdminScans} />
      <Route path="/admin/scans/:scanId" component={AdminScanDetail} />
      <Route path="/admin/revenue" component={AdminRevenue} />
      <Route path="/admin/subscriptions" component={AdminSubscriptions} />
      <Route path="/admin/subscriptions/:subscriptionId" component={AdminSubscriptionDetail} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/logs" component={AdminLogs} />
      <Route path="/bugs/:bugId" component={BugDetail} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/all-alerts" component={AllAlerts} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Shopify authentication
  const { session, isLoading: shopifyLoading, error: shopifyError, isAuthenticated } = useShopifyAuth();

  // Check if this is admin portal
  const isAdminPortal = location.startsWith('/admin');
  
  // Check if we're in Shopify context (have shop parameter)
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');
  const isShopifyContext = !!shop;

  // Handle onboarding for authenticated users
  useEffect(() => {
    if (isAuthenticated && session && !localStorage.getItem('hasSeenOnboarding')) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, session]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  // Show loading state for Shopify authentication
  if (shopifyLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex items-center justify-center bg-shopify-bg">
          <div className="text-center">
            <div className="w-8 h-8 animate-spin border-4 border-shopify-green border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-shopify-text">Authenticating with Shopify...</p>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  // Show error state for Shopify authentication
  if (shopifyError) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex items-center justify-center bg-shopify-bg">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{shopifyError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-shopify-green text-white px-4 py-2 rounded-lg hover:bg-shopify-green-dark"
            >
              Try Again
            </button>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  // If authenticated, show the main app
  if (isAuthenticated && session) {
    return (
      <QueryClientProvider client={queryClient}>
        <ShopifyProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            {showOnboarding && (
              <OnboardingAnimation onComplete={handleOnboardingComplete} />
            )}
          </TooltipProvider>
        </ShopifyProvider>
      </QueryClientProvider>
    );
  }

  // If not authenticated and we have a shop parameter, redirect to Shopify OAuth
  if (isShopifyContext && !isAuthenticated && !shopifyLoading) {
    const authUrl = `/auth?shop=${shop}`;
    window.location.href = authUrl;
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex items-center justify-center bg-shopify-bg">
          <div className="text-center">
            <div className="w-8 h-8 animate-spin border-4 border-shopify-green border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-shopify-text">Redirecting to Shopify...</p>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  // If no shop parameter and not authenticated, show Shopify installation page
  if (!isShopifyContext && !isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex items-center justify-center bg-shopify-bg">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-shopify-green rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Bug Patrol</h1>
              <p className="text-gray-600 mb-6">Monitor your Shopify store for bugs and performance issues</p>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        This app can only be installed through the Shopify App Store or Shopify Admin. 
                        Direct installation is not allowed for security reasons.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Install from your Shopify Admin:</p>
                  <ol className="text-xs text-gray-500 space-y-1">
                    <li>1. Go to your Shopify Admin</li>
                    <li>2. Navigate to Apps → App and sales channel settings</li>
                    <li>3. Click "Develop apps" → "Create an app"</li>
                    <li>4. Add this app to your store</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  // Fallback loading state
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex items-center justify-center bg-shopify-bg">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin border-4 border-shopify-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-shopify-text">Loading...</p>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
