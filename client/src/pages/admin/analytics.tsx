import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, TrendingUp, Users, Activity, DollarSign, Store, AlertTriangle, Star } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import { useQuery } from "@tanstack/react-query";

export default function AdminAnalytics() {
  // Fetch real analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const response = await fetch("/api/admin/analytics");
      if (!response.ok) {
        throw new Error("Failed to fetch admin analytics");
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
              <div className="text-lg">Loading analytics...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const data = analyticsData || {
    overview: {
      totalRevenue: 0,
      totalCustomers: 0,
      activeStores: 0,
      totalScans: 0,
      avgIssuesPerStore: 0,
      customerSatisfaction: 0
    },
    growth: {
      revenueGrowth: 0,
      customerGrowth: 0,
      scanGrowth: 0,
      churnRate: 0
    },
    planDistribution: [],
    topIssues: []
  };

  return (
    <div className="flex h-screen bg-shopify-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-shopify-text">Analytics Dashboard</h1>
              <p className="text-gray-500">Comprehensive insights and performance metrics</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">Export Report</Button>
              <Button className="bg-shopify-green hover:bg-shopify-green-dark">Custom Report</Button>
            </div>
          </div>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-green">
                  ${data.overview.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-green-600">+{data.growth.revenueGrowth}% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {data.overview.totalCustomers.toLocaleString()}
                </div>
                <p className="text-xs text-green-600">+{data.growth.customerGrowth}% growth</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
                <Store className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {data.overview.activeStores.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">{(data.overview.activeStores / data.overview.totalCustomers * 100).toFixed(1)}% active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                <Activity className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {data.overview.totalScans.toLocaleString()}
                </div>
                <p className="text-xs text-green-600">+{data.growth.scanGrowth}% growth</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Issues/Store</CardTitle>
                <AlertTriangle className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {data.overview.avgIssuesPerStore}
                </div>
                <p className="text-xs text-gray-500">Per store average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
                <Star className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {data.overview.customerSatisfaction}/5
                </div>
                <p className="text-xs text-gray-500">Customer rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Plan Distribution & Top Issues */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart className="w-5 h-5" />
                  <span>Plan Distribution</span>
                </CardTitle>
                <CardDescription>Revenue breakdown by subscription plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.planDistribution.map((plan: any) => (
                    <div key={plan.plan} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          plan.plan === 'Enterprise' ? 'bg-purple-500' :
                          plan.plan === 'Pro' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{plan.plan}</p>
                          <p className="text-xs text-gray-500">{plan.customers} customers</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">${plan.revenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{plan.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Top Issues</span>
                </CardTitle>
                <CardDescription>Most common issues across all stores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topIssues.map((issue: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-medium text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{issue.type}</p>
                          <p className="text-xs text-gray-500">{issue.stores} stores affected</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{issue.count}</p>
                        <p className="text-xs text-gray-500">total issues</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Growth Metrics */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Growth Metrics</span>
              </CardTitle>
              <CardDescription>Monthly growth and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">+{data.growth.revenueGrowth}%</div>
                  <p className="text-sm text-gray-500">Revenue Growth</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">+{data.growth.customerGrowth}%</div>
                  <p className="text-sm text-gray-500">Customer Growth</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">+{data.growth.scanGrowth}%</div>
                  <p className="text-sm text-gray-500">Scan Growth</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{data.growth.churnRate}%</div>
                  <p className="text-sm text-gray-500">Churn Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}