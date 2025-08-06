import { Bug, ChartLine, AlertTriangle, Gauge, Bell, Settings, Crown, Monitor, Camera } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useShopifyAuth } from "@/hooks/use-shopify-auth";
import { GlobalScreenshotButton } from "@/components/global-screenshot-button";

export default function Sidebar() {
  const [location] = useLocation();
  const { session } = useShopifyAuth();
  
  // Customer Portal Navigation (for store owners)
  const customerNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: ChartLine },
    { name: 'Bug Reports', href: '/bugs', icon: AlertTriangle },
    { name: 'Performance', href: '/performance', icon: Gauge },
    { name: 'Store Monitoring', href: '/monitoring', icon: Monitor },
    { name: 'Alerts', href: '/alerts', icon: Bell },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Admin Portal Navigation (for app owners)
  const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: ChartLine },
    { name: 'Customers', href: '/admin/customers', icon: Bug },
    { name: 'Stores', href: '/admin/stores', icon: Monitor },
    { name: 'Scans', href: '/admin/scans', icon: Gauge },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: Settings },
    { name: 'Analytics', href: '/admin/analytics', icon: AlertTriangle },
    { name: 'Revenue', href: '/admin/revenue', icon: Crown },
    { name: 'System Logs', href: '/admin/logs', icon: Bell },
  ];

  // Determine if we're in admin portal
  const isAdminPortal = location.startsWith('/admin');
  const navigation = isAdminPortal ? adminNavigation : customerNavigation;

  return (
    <div className="w-64 bg-shopify-surface border-r border-shopify-border flex-shrink-0">
      <div className="p-4 border-b border-shopify-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-shopify-green rounded-lg flex items-center justify-center">
            <Bug className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-shopify-text">Bug Patrol</h1>
            <p className="text-xs text-gray-500">
              {isAdminPortal ? 'Admin Portal' : 'QA & Site Monitoring'}
            </p>
          </div>
        </div>
        
        {/* Store Information */}
        {!isAdminPortal && session?.shop && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.storeName || session.shop}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.shop}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href === '/dashboard' && location === '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-shopify-green text-white'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Global Screenshot Tool Button */}
      <div className="p-4 border-t border-gray-200">
        <GlobalScreenshotButton />
      </div>
    </div>
  );
}
