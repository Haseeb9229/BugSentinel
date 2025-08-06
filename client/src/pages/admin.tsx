import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Store, DollarSign, Activity, AlertTriangle, TrendingUp, Users } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import { useQuery } from "@tanstack/react-query";

export default function Admin() {
  // This is the ADMIN PORTAL for app owners to manage all store installations
  
  // Fetch real admin dashboard data
  const { data: adminMetrics, isLoading } = useQuery({
    queryKey: ["/api/admin/overview"],
    queryFn: async () => {
      const response = await fetch("/api/admin/overview");
      if (!response.ok) {
        throw new Error("Failed to fetch admin overview");
      }
      return response.json();
    }
  });

  // Fetch real stores data
  const { data: stores } = useQuery({
    queryKey: ["/api/admin/stores"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stores");
      if (!response.ok) {
        throw new Error("Failed to fetch admin stores");
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading admin dashboard...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const metrics = adminMetrics || {
    totalStores: 0,
    activeStores: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    totalScans: 0,
    criticalIssues: 0,
    averageUptime: 0
  };

  const recentInstallations = stores?.slice(0, 4) || [];
  const topPerformingStores = stores?.slice(0, 4) || [];

  return (
    <div className="flex h-screen bg-shopify-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Crown className="w-6 h-6 text-shopify-green" />
              <div>
                <h1 className="text-2xl font-bold text-shopify-text">Bug Patrol Admin Portal</h1>
                <p className="text-sm text-gray-500">Manage all store installations and revenue</p>
              </div>
            </div>
            <Badge className="bg-shopify-green text-white">
              App Owner Dashboard
            </Badge>
          </div>

          {/* Revenue & Growth Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-green">${metrics.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-gray-500">+{metrics.monthlyGrowth}% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
                <Store className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-green">{metrics.totalStores}</div>
                <p className="text-xs text-gray-500">{metrics.activeStores} active stores</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                <Activity className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-purple">{metrics.totalScans.toLocaleString()}</div>
                <p className="text-xs text-gray-500">{metrics.averageUptime}% avg uptime</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                <AlertTriangle className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.criticalIssues}</div>
                <p className="text-xs text-gray-500">Across all stores</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Installations & Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Recent Installations</span>
                </CardTitle>
                <CardDescription>Latest store installations and their plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInstallations.map((store: any) => (
                    <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-shopify-green rounded-full flex items-center justify-center">
                          <Store className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{store.name}</p>
                          <p className="text-xs text-gray-500">{store.domain}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${
                          store.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                          store.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {store.plan}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{store.revenue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Top Performing Stores</span>
                </CardTitle>
                <CardDescription>Stores with highest scan activity and uptime</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformingStores.map((store: any) => (
                    <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-shopify-purple rounded-full flex items-center justify-center">
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{store.name}</p>
                          <p className="text-xs text-gray-500">{store.totalScans} scans</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{store.uptime}</p>
                        <p className="text-xs text-gray-500">{store.revenue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle>System Health & Statistics</CardTitle>
              <CardDescription>Overall Bug Patrol app performance and infrastructure status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Service Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Scanning Engine</span>
                      <Badge className="bg-green-100 text-green-800">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database</span>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Alert System</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Revenue Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Basic Plans</span>
                      <span className="font-medium">$8,670</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pro Plans</span>
                      <span className="font-medium">$11,230</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Enterprise Plans</span>
                      <span className="font-medium">$4,680</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Growth Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New Installs (30d)</span>
                      <span className="font-medium">+127</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Churn Rate</span>
                      <span className="font-medium">2.3%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Revenue/Store</span>
                      <span className="font-medium">$19.71</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex space-x-4">
                <Button className="bg-shopify-green hover:bg-shopify-green-dark">
                  Export Revenue Report
                </Button>
                <Button variant="outline">
                  View System Logs
                </Button>
                <Button variant="outline">
                  Manage Subscriptions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}