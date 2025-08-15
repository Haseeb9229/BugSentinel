import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Monitor, Clock, FileText, Package, Wifi, WifiOff, AlertCircle, CheckCircle, RefreshCw, Settings } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useShopifyAuth } from "@/hooks/use-shopify-auth";
import { useDevice } from "@/contexts/device-context";
import { useLocation } from "wouter";

export default function Monitoring() {
  const { deviceType } = useDevice();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Get session data from authentication hook
  const { session, isLoading: sessionLoading, isAuthenticated } = useShopifyAuth();

  // Set storeId when session is available
  if (session?.storeId && !storeId) {
    setStoreId(session.storeId);
  }

  // Fetch real monitoring data
  const { data: uptimeData, isLoading: uptimeLoading } = useQuery({
    queryKey: ["/api/uptime", storeId],
    enabled: !!storeId,
  });

  // TODO: Uncomment in next version when theme changes webhook is fully implemented
  // const { data: themeChanges, isLoading: themeChangesLoading } = useQuery({
  //   queryKey: ["/api/theme-changes", storeId],
  //   enabled: !!storeId,
  // });

  const { data: appChanges, isLoading: appChangesLoading } = useQuery({
    queryKey: ["/api/app-installations", storeId],
    enabled: !!storeId,
  });

  const { data: scheduledScans, isLoading: scheduledScansLoading } = useQuery({
    queryKey: ["/api/scheduled-scans"],
    enabled: !!storeId,
  });

  const { data: recentScans, isLoading: recentScansLoading } = useQuery({
    queryKey: ["/api/dashboard", storeId, deviceType],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/${storeId}?deviceType=${deviceType}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }
      const data = await response.json();
      return data;
    },
    enabled: !!storeId,
  });

  const handleRefresh = async () => {
    if (!storeId) return;
    
    setIsRefreshing(true);
    try {
      // Invalidate and refetch all monitoring data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/uptime", storeId] }),
        // TODO: Uncomment in next version: queryClient.invalidateQueries({ queryKey: ["/api/theme-changes", storeId] }),
        queryClient.invalidateQueries({ queryKey: ["/api/app-installations", storeId] }),
        queryClient.invalidateQueries({ queryKey: ["/api/scheduled-scans"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard", storeId, deviceType] })
      ]);
      
      toast({
        title: "Data Refreshed",
        description: "Monitoring data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh monitoring data.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGoToSettings = () => {
    setLocation('/settings?highlight=scan-frequency');
  };

  const getStatusIcon = (status: string) => {
    return status === "up" ? (
      <Wifi className="w-4 h-4 text-green-500" />
    ) : (
      <WifiOff className="w-4 h-4 text-red-500" />
    );
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case "created": return "bg-green-100 text-green-800";
      case "modified": return "bg-blue-100 text-blue-800";
      case "deleted": return "bg-red-100 text-red-800";
      case "added": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "installed": return "bg-green-100 text-green-800";
      case "updated": return "bg-blue-100 text-blue-800";
      case "uninstalled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
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
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-shopify-green text-white px-4 py-2 rounded-lg hover:bg-shopify-green-dark"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const uptime = uptimeData;
  // const themeChangesData = themeChanges;
  const appChangesData = appChanges;

  return (
    <div className="flex h-screen bg-shopify-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-shopify-text">Store Monitoring</h1>
                <p className="text-gray-500">
                  {session?.shop && `Monitoring ${session.shop}`}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/uptime/check/${session?.storeId}`, {
                        method: 'POST'
                      });
                      if (response.ok) {
                        toast({
                          title: "Uptime Check",
                          description: "Uptime check completed successfully.",
                        });
                        // Refresh the data
                        queryClient.invalidateQueries({ queryKey: ['uptime', session?.storeId] });
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to perform uptime check.",
                        variant: "destructive",
                      });
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Monitor className="w-4 h-4" />
                  Check Uptime
                </Button>
                <Button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="uptime" className="space-y-6">
            <TabsList>
              <TabsTrigger value="uptime" className="flex items-center space-x-2">
                <Monitor className="w-4 h-4" />
                <span>Uptime</span>
              </TabsTrigger>
              {/* TODO: Uncomment in next version when theme changes webhook is fully implemented
              <TabsTrigger value="theme" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Theme Changes</span>
              </TabsTrigger>
              */}
              {/* TODO: Uncomment when Shopify adds app/installed and app/updated webhooks
              <TabsTrigger value="apps" className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>App Changes</span>
              </TabsTrigger>
              */}
                          <TabsTrigger value="scans" className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Scheduled Scans</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Recent Scans</span>
            </TabsTrigger>

            </TabsList>

            {/* Uptime Tab */}
            <TabsContent value="uptime" className="space-y-6">
              {uptimeLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading uptime data...</div>
                </div>
              ) : !uptime ? (
                <div className="text-center py-8">
                  <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No uptime data available</p>
                  <p className="text-sm text-gray-400 mt-2">Uptime monitoring will start automatically</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Status</CardTitle>
                        {getStatusIcon(uptime.currentStatus)}
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">Online</div>
                        <p className="text-xs text-gray-500">Last checked: 2 minutes ago</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                        <Clock className="w-4 h-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{uptime.uptime}%</div>
                        <p className="text-xs text-gray-500">Last 30 days</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                        <Monitor className="w-4 h-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{uptime.responseTime}ms</div>
                        <p className="text-xs text-gray-500">Average</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Incidents</CardTitle>
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{uptime.incidentsThisMonth}</div>
                        <p className="text-xs text-gray-500">This month</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Status Checks</CardTitle>
                      <CardDescription>Last 24 hours of uptime monitoring</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {uptime.recentChecks && uptime.recentChecks.length > 0 ? (
                          uptime.recentChecks.map((check: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                {getStatusIcon(check.status)}
                                <div>
                                  <p className="font-medium text-sm">{check.status === "up" ? "Online" : "Offline"}</p>
                                  <p className="text-xs text-gray-500">{check.timestamp}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{check.responseTime}ms</p>
                                <p className="text-xs text-gray-500">Response time</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No recent checks available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* TODO: Uncomment in next version when theme changes webhook is fully implemented
            Theme Changes Tab
            <TabsContent value="theme" className="space-y-6">
              {themeChangesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading theme changes...</div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Theme Changes</CardTitle>
                    <CardDescription>Track modifications to your store's theme files</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {themeChangesData && themeChangesData.length > 0 ? (
                        themeChangesData.map((change: any) => (
                          <div key={change.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{change.fileName}</p>
                                <p className="text-xs text-gray-500">{change.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getChangeTypeColor(change.changeType)}>
                                {change.changeType}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">{change.timestamp}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No theme changes detected</p>
                          <p className="text-sm text-gray-400 mt-2">Theme changes will appear here when detected</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            */}

            {/* TODO: Uncomment when Shopify adds app/installed and app/updated webhooks
            App Changes Tab
            <TabsContent value="apps" className="space-y-6">
              {appChangesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading app changes...</div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>App Installation History</CardTitle>
                    <CardDescription>Track app installations, updates, and removals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {appChangesData && appChangesData.length > 0 ? (
                        appChangesData.map((app: any) => (
                          <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{app.appName}</p>
                                <p className="text-xs text-gray-500">Version {app.version}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getActionColor(app.action)}>
                                {app.action}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">{app.timestamp}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No app changes detected</p>
                          <p className="text-sm text-gray-400 mt-2">App installations and updates will appear here</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            */}

            {/* Scheduled Scans Tab */}
            <TabsContent value="scans" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Scheduled Scans</CardTitle>
                      <CardDescription>View and manage automated scan schedules</CardDescription>
                    </div>
                    <Button
                      onClick={handleGoToSettings}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Configure Frequency</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scheduledScans && Array.isArray(scheduledScans) && scheduledScans.length > 0 ? (
                      scheduledScans.map((scan: any) => (
                        <div key={scan.storeId} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Store: {scan.storeId}</p>
                              <p className="text-xs text-gray-500">
                                Next scan: {new Date(scan.nextScanTime).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100 text-green-800">
                              Scheduled
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No scheduled scans found</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Configure scan frequency in Settings to enable automated scanning
                        </p>
                        <Button
                          onClick={handleGoToSettings}
                          className="mt-4 flex items-center space-x-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Go to Settings</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recent Scans Tab */}
            <TabsContent value="recent" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Scan History</CardTitle>
                  <CardDescription>View completed scans and their results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentScans?.scans && Array.isArray(recentScans.scans) && recentScans.scans.length > 0 ? (
                      recentScans.scans.map((scan: any) => (
                        <div key={scan.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              scan.status === 'completed' ? 'bg-green-100' : 
                              scan.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                            }`}>
                              {scan.status === 'completed' ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : scan.status === 'failed' ? (
                                <AlertCircle className="w-5 h-5 text-red-600" />
                              ) : (
                                <Clock className="w-5 h-5 text-yellow-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{scan.type.replace('_', ' ').toUpperCase()}</p>
                              <p className="text-xs text-gray-500">
                                {scan.startedAt ? new Date(scan.startedAt).toLocaleString() : 'Unknown'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={
                              scan.status === 'completed' ? 'bg-green-100 text-green-800' :
                              scan.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {scan.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {scan.pagesScanned || 0} pages • {scan.duration || 0}s
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No recent scans found</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Run a manual scan or wait for scheduled scans to complete
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}