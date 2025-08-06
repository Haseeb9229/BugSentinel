import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import StatsOverview from "@/components/dashboard/stats-overview";
import RecentIssues from "@/components/dashboard/recent-issues";
import PerformanceMetrics from "@/components/dashboard/performance-metrics";
import ScanActivity from "@/components/dashboard/scan-activity";

import RecentFixes from "@/components/dashboard/recent-fixes";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useShopifyAuth } from "@/hooks/use-shopify-auth";


interface DashboardData {
  store: any;
  stats: {
    storeHealth: number;
    activeIssues: number;
    criticalIssues: number;
    warningIssues: number;
    uptime: number;
  };
  bugs: any[];
  scans: any[];
  nextScanTime?: string | null;
  performanceMetrics: any;
  trends?: {
    lcp?: { trend: 'improving' | 'worsening' };
    fcp?: { trend: 'improving' | 'worsening' };
    cls?: { trend: 'improving' | 'worsening' };
    overallScore?: { trend: 'improving' | 'worsening' };
  };
  alertSettings: any;
}

export default function Dashboard() {
  const [isScanning, setIsScanning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get session data from authentication hook
  const { session, isLoading: sessionLoading, isAuthenticated } = useShopifyAuth();

  // Set storeId when session is available
  useEffect(() => {
    if (session?.storeId) {
      setStoreId(session.storeId);
    }
  }, [session]);

  const { data: dashboardData, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard", storeId],
    enabled: !!storeId, // Only run query when we have a storeId
  });

  const { data: testModeData } = useQuery<{ testMode: boolean; testWebsite: string }>({
    queryKey: ["/api/test-mode"],
    enabled: !!storeId,
  });



  const handleManualScan = async () => {
    if (!storeId) return;
    
    try {
      setIsScanning(true);
      
      // Start the scan
      const scanResponse = await apiRequest("POST", "/api/scans", {
        storeId,
        type: "full_site",
        status: "running"
      });
      
      if (!scanResponse.ok) {
        throw new Error('Failed to start scan');
      }

      const scanData = await scanResponse.json();
      console.log('Scan started:', scanData);

      // Poll for scan completion
      const pollScanStatus = async () => {
        const maxAttempts = 60; // 5 minutes max
        let attempts = 0;
        
        const poll = async () => {
          if (attempts >= maxAttempts) {
            setIsScanning(false);
            toast({
              title: "Scan Timeout",
              description: "Scan is taking longer than expected. Check back later.",
              variant: "destructive",
            });
            return;
          }

          try {
            const statusResponse = await apiRequest("GET", `/api/scans/${scanData.id}`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              console.log('Scan status:', statusData);

              if (statusData.status === 'completed') {
                setIsScanning(false);
                toast({
                  title: "Scan Completed",
                  description: `Found ${statusData.issuesFound || 0} issues.`,
                });
                refetch(); // Refresh dashboard data
                return;
              } else if (statusData.status === 'failed') {
                setIsScanning(false);
                toast({
                  title: "Scan Failed",
                  description: "The scan encountered an error. Please try again.",
                  variant: "destructive",
                });
                return;
              }
            }
          } catch (error) {
            console.error('Error polling scan status:', error);
          }

          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        };

        poll();
      };

      pollScanStatus();
      
    } catch (error) {
      console.error('Failed to start scan:', error);
      setIsScanning(false);
      toast({
        title: "Scan Error",
        description: "Failed to start scan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshStoreData = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Data Refreshed",
        description: "Dashboard data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show loading state while getting session
  if (sessionLoading) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading store information...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no store found
  if (!storeId || !isAuthenticated) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">Store Not Found</div>
                <div className="text-gray-600 mb-4">Unable to find your store information.</div>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-shopify-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-shopify-text">Store Health Dashboard</h1>
              <p className="text-gray-500">
                {session?.shop && `Monitoring ${session.shop}`}
              </p>
              {/* Test Mode Indicator */}
              {testModeData?.testMode && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    🧪 Test Mode: Scans will use {testModeData.testWebsite}
                  </span>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={refreshStoreData}
                disabled={isRefreshing || isLoading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
              <Button
                onClick={handleManualScan}
                disabled={isScanning}
                className="bg-shopify-green hover:bg-shopify-green-dark text-white"
              >
                {isScanning ? "Scanning..." : "Run Scan"}
              </Button>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="space-y-6">
            <StatsOverview stats={dashboardData?.stats || {
              storeHealth: 0,
              activeIssues: 0,
              criticalIssues: 0,
              warningIssues: 0,
              uptime: 0
            }} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentIssues bugs={dashboardData?.bugs || []} />
              <PerformanceMetrics 
                metrics={dashboardData?.performanceMetrics} 
                trends={dashboardData?.trends}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScanActivity 
                scans={dashboardData?.scans || []} 
                nextScanTime={dashboardData?.nextScanTime}
              />
              <RecentFixes />
            </div>
            

          </div>
        </div>
      </div>


    </div>
  );
}
