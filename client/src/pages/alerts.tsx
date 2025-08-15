import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useShopifyAuth } from "@/hooks/use-shopify-auth";
import { useDevice } from "@/contexts/device-context";
import { useLocation } from "wouter";
import type { Alert, AlertSetting } from "@shared/schema";

export default function Alerts() {
  const { deviceType } = useDevice();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [responseTimeThreshold, setResponseTimeThreshold] = useState(2000);
  const [errorRateThreshold, setErrorRateThreshold] = useState(5);
  const [downtimeThreshold, setDowntimeThreshold] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Get session data from authentication hook
  const { session, isLoading: sessionLoading, isAuthenticated } = useShopifyAuth();

  // Set storeId when session is available
  if (session?.storeId && !storeId) {
    setStoreId(session.storeId);
  }

  const { data: alertSettings } = useQuery<AlertSetting>({
    queryKey: ["/api/alert-settings", storeId],
    enabled: !!storeId,
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (alertSettings) {
      setResponseTimeThreshold(alertSettings.responseTimeThreshold || 2000);
      setErrorRateThreshold(alertSettings.errorRateThreshold || 5);
      setDowntimeThreshold(alertSettings.uptimeThreshold || 5);
    }
  }, [alertSettings]);

  // Fetch real alerts data
  const { data: alertsData, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts", storeId],
    enabled: !!storeId,
  });

  const handleSaveThresholds = async () => {
    if (!storeId) return;
    
    setIsSaving(true);
    try {
      await apiRequest("PATCH", `/api/alert-settings/${storeId}`, {
        responseTimeThreshold,
        errorRateThreshold,
        uptimeThreshold: downtimeThreshold
      });
      
      toast({
        title: "Thresholds Saved",
        description: "Alert thresholds have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save alert thresholds. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical": return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "info": return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-red-100 text-red-800">Active</Badge>;
      case "acknowledged": return <Badge className="bg-yellow-100 text-yellow-800">Acknowledged</Badge>;
      case "resolved": return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string | Date | null) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const handleViewAllAlerts = () => {
    setLocation("/all-alerts");
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

  const alerts = alertsData || [];

  return (
    <div className="flex h-screen bg-shopify-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-shopify-text">Alerts</h1>
            <p className="text-gray-500">
              {session?.shop && `Recent alerts for ${session.shop}`}
            </p>
          </div>

          <div className="space-y-6">
            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Recent Alerts</span>
                </CardTitle>
                <CardDescription>Latest alerts and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Loading alerts...</div>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-500">No alerts found</p>
                    <p className="text-sm text-gray-400 mt-2">Your store is running smoothly!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm truncate">{alert.title}</h4>
                            {getStatusBadge(alert.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{alert.message}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimestamp(alert.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleViewAllAlerts}
                    disabled={alertsLoading || alerts.length === 0}
                  >
                    View All Alerts ({alerts.length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Alert Thresholds */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Thresholds</CardTitle>
                <CardDescription>Configure when alerts should be triggered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="response-time">Response Time Threshold (ms)</Label>
                    <Input 
                      id="response-time" 
                      type="number" 
                      placeholder="2000"
                      value={responseTimeThreshold}
                      onChange={(e) => setResponseTimeThreshold(Number(e.target.value))}
                      disabled={isSaving}
                    />
                    <p className="text-xs text-gray-500">Alert when response time exceeds this value</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="error-rate">Error Rate Threshold (%)</Label>
                    <Input 
                      id="error-rate" 
                      type="number" 
                      placeholder="5"
                      value={errorRateThreshold}
                      onChange={(e) => setErrorRateThreshold(Number(e.target.value))}
                      disabled={isSaving}
                    />
                    <p className="text-xs text-gray-500">Alert when error rate exceeds this percentage</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="downtime">Downtime Threshold (minutes)</Label>
                    <Input 
                      id="downtime" 
                      type="number" 
                      placeholder="5"
                      value={downtimeThreshold}
                      onChange={(e) => setDowntimeThreshold(Number(e.target.value))}
                      disabled={isSaving}
                    />
                    <p className="text-xs text-gray-500">Alert after this many minutes of downtime</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={handleSaveThresholds}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Thresholds"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}