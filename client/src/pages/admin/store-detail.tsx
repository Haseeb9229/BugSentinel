import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, Globe, Calendar, Activity, AlertTriangle, TrendingUp, Users } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import { useQuery } from "@tanstack/react-query";

export default function AdminStoreDetail() {
  const { storeId } = useParams();
  const [, setLocation] = useLocation();

  // Fetch real store details
  const { data: store, isLoading } = useQuery({
    queryKey: ["/api/admin/stores", storeId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/stores/${storeId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch store details");
      }
      return response.json();
    },
    enabled: !!storeId
  });

  const runManualScan = (scanType: string) => {
    // In real implementation, would trigger API call
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading store details...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Store not found</div>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => setLocation("/admin/stores")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Stores
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-shopify-text">{store.name}</h1>
                <p className="text-sm text-gray-500">{store.domain}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => runManualScan("Performance")}>
                <Activity className="w-4 h-4 mr-2" />
                Performance Scan
              </Button>
              <Button variant="outline" onClick={() => runManualScan("Full Site")}>
                <Globe className="w-4 h-4 mr-2" />
                Full Site Scan
              </Button>
              <Button className="bg-shopify-green hover:bg-shopify-green-dark">
                View Live Store
              </Button>
            </div>
          </div>

          {/* Store Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Store Health</CardTitle>
                <TrendingUp className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-green">{store.metrics.storeHealth}%</div>
                <p className="text-xs text-gray-500">Overall health score</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                <Activity className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-purple">{store.metrics.totalScans}</div>
                <p className="text-xs text-gray-500">All time scans</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
                <AlertTriangle className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{store.metrics.activeBugs}</div>
                <p className="text-xs text-gray-500">{store.metrics.resolvedBugs} resolved</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <Activity className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{store.metrics.uptime}%</div>
                <p className="text-xs text-gray-500">30-day average</p>
              </CardContent>
            </Card>
          </div>

          {/* Store Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Store Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Store className="w-5 h-5" />
                  <span>Store Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Plan</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={
                      store.subscription.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                      store.subscription.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {store.subscription.plan}
                    </Badge>
                    <span className="text-sm font-medium">${store.subscription.amount}/mo</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-sm mt-1">{store.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Setup Date</label>
                  <p className="text-sm mt-1">{store.setupDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Next Billing</label>
                  <p className="text-sm mt-1">{store.subscription.nextBilling}</p>
                </div>
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Owner Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm mt-1">{store.owner.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm mt-1">{store.owner.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm mt-1">{store.owner.phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Technical Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Technical Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Shopify Plan</label>
                  <p className="text-sm mt-1">{store.technicalInfo.shopifyPlan}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Theme</label>
                  <p className="text-sm mt-1">{store.technicalInfo.theme}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Apps Installed</label>
                  <p className="text-sm mt-1">{store.technicalInfo.apps}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Products</label>
                  <p className="text-sm mt-1">{store.technicalInfo.products}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Orders</label>
                  <p className="text-sm mt-1">{store.technicalInfo.orders}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest scans and actions for this store</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {store.recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.status === 'success' ? 'bg-green-100' :
                        activity.status === 'warning' ? 'bg-yellow-100' :
                        activity.status === 'running' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        <Activity className={`w-4 h-4 ${
                          activity.status === 'success' ? 'text-green-600' :
                          activity.status === 'warning' ? 'text-yellow-600' :
                          activity.status === 'running' ? 'text-blue-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                    <Badge className={
                      activity.status === 'success' ? 'bg-green-100 text-green-800' :
                      activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      activity.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}