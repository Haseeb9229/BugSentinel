import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface ShopifySession {
  shop: string;
  accessToken: string;
  isAuthenticated: boolean;
  storeId?: string;
  storeName?: string;
  plan?: string;
  nextBillingDate?: string;
}

export function useShopifyAuth() {
  const [session, setSession] = useState<ShopifySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get shop and host from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const shop = urlParams.get('shop');
        const host = urlParams.get('host');

        // If we have shop and host parameters, we're in Shopify context
        if (shop && host) {
          try {
            const response = await apiRequest('GET', `/api/auth/session?shop=${shop}`);
            if (response.ok) {
              const sessionData = await response.json();
              if (sessionData.isAuthenticated) {
                setSession(sessionData);
                // Store the shop for future use
                localStorage.setItem('currentShop', sessionData.shop);
                setIsLoading(false);
                return;
              }
            }
            // No valid session, redirect to OAuth
            window.location.href = `/auth?shop=${shop}`;
            return;
          } catch (err) {
            // Error checking session, redirect to OAuth
            window.location.href = `/auth?shop=${shop}`;
            return;
          }
        }

        // No shop parameter, check if we have a stored session
        const storedShop = localStorage.getItem('currentShop');
        if (storedShop) {
          try {
            // Pass the stored shop to validate the specific session
            const response = await apiRequest('GET', `/api/auth/validate?shop=${storedShop}`);
            if (response.ok) {
              const sessionData = await response.json();
              if (sessionData.isAuthenticated) {
                setSession(sessionData);
                setIsLoading(false);
                return;
              }
            }
          } catch (err) {
            console.log('Stored session is invalid');
            localStorage.removeItem('currentShop');
          }
        }

        // No valid session found
        setIsLoading(false);
      } catch (err) {
        setError('Authentication failed');
        console.error('Auth error:', err);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const logout = () => {
    setSession(null);
    // Clear any stored session data
    localStorage.removeItem('shopify_session');
    localStorage.removeItem('currentShop');
  };

  return {
    session,
    isLoading,
    error,
    logout,
    isAuthenticated: !!session?.isAuthenticated
  };
} 