import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ShopifyProviderProps {
  children: React.ReactNode;
}

export function ShopifyProvider({ children }: ShopifyProviderProps) {
  const { toast } = useToast();

  useEffect(() => {
    // Set up Shopify App Bridge toast integration when available
    const setupShopifyToast = async () => {
      const shopifyApp = (window as any).shopifyApp;
      if (shopifyApp) {
        try {
          const { Toast } = await import('@shopify/app-bridge/actions');
          
          const showShopifyToast = (title: string, message?: string, isError = false) => {
            const toastAction = Toast.create(shopifyApp, {
              message: message || title,
              duration: 5000,
              isError,
            });
            toastAction.dispatch(Toast.Action.SHOW);
          };

          // Override the toast function to also show Shopify toasts when in embedded context
          const originalToast = toast;
          const enhancedToast = (props: any) => {
            originalToast(props);
            if (props.title) {
              showShopifyToast(props.title, props.description, props.variant === 'destructive');
            }
          };

          // Store the enhanced toast function globally for use in other components
          (window as any).shopifyToast = enhancedToast;
        } catch (error) {
          console.warn('Shopify App Bridge not available:', error);
        }
      }
    };

    setupShopifyToast();
  }, [toast]);

  return <>{children}</>;
} 