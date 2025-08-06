import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, CreditCard, Calendar, Download } from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";

export default function AdminRevenue() {
  const [, setLocation] = useLocation();
  const revenueStats = {
    totalRevenue: 24580,
    monthlyGrowth: 12.5,
    mrr: 22145,
    churnRate: 2.3,
    avgRevenuePerUser: 19.71,
    totalTransactions: 1247
  };

  const monthlyRevenue = [
    { month: "Jan 2024", revenue: 18420, growth: 8.2 },
    { month: "Feb 2024", revenue: 19680, growth: 6.8 },
    { month: "Mar 2024", revenue: 21230, growth: 7.9 },
    { month: "Apr 2024", revenue: 22145, growth: 4.3 },
    { month: "May 2024", revenue: 23890, growth: 7.9 },
    { month: "Jun 2024", revenue: 24580, growth: 2.9 }
  ];

  const planBreakdown = [
    { plan: "Basic", count: 856, revenue: 8670, percentage: 35.3 },
    { plan: "Pro", count: 312, revenue: 11230, percentage: 45.7 },
    { plan: "Enterprise", count: 79, revenue: 4680, percentage: 19.0 }
  ];

  const recentTransactions = [
    {
      id: "1",
      store: "TechCorp Solutions",
      plan: "Enterprise",
      amount: 199,
      date: "2024-06-28",
      status: "paid"
    },
    {
      id: "2",
      store: "Fashion Hub", 
      plan: "Pro",
      amount: 89,
      date: "2024-06-28",
      status: "paid"
    },
    {
      id: "3",
      store: "Sports World",
      plan: "Pro",
      amount: 89,
      date: "2024-06-27",
      status: "paid"
    },
    {
      id: "4",
      store: "Wellness Store",
      plan: "Basic",
      amount: 29,
      date: "2024-06-27",
      status: "pending"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "Enterprise": return "bg-purple-100 text-purple-800";
      case "Pro": return "bg-blue-100 text-blue-800";
      case "Basic": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex h-screen bg-shopify-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-6 h-6 text-shopify-green" />
              <div>
                <h1 className="text-2xl font-bold text-shopify-text">Revenue Management</h1>
                <p className="text-sm text-gray-500">Track revenue, subscriptions, and financial metrics</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button className="bg-shopify-green hover:bg-shopify-green-dark">
                Financial Dashboard
              </Button>
            </div>
          </div>

          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-green">${revenueStats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-gray-500">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                <TrendingUp className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${revenueStats.mrr.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Monthly Recurring</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth</CardTitle>
                <TrendingUp className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+{revenueStats.monthlyGrowth}%</div>
                <p className="text-xs text-gray-500">Month over month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ARPU</CardTitle>
                <CreditCard className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-purple">${revenueStats.avgRevenuePerUser}</div>
                <p className="text-xs text-gray-500">Avg per user</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <TrendingUp className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{revenueStats.churnRate}%</div>
                <p className="text-xs text-gray-500">Monthly churn</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <CreditCard className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{revenueStats.totalTransactions}</div>
                <p className="text-xs text-gray-500">This month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>Revenue growth over the past 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyRevenue.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-shopify-text">{month.month}</h4>
                        <p className="text-sm text-gray-500">+{month.growth}% growth</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-shopify-green">${month.revenue.toLocaleString()}</p>
                        <div className="flex items-center text-green-600 text-sm">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {month.growth}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Plan Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
                <CardDescription>Revenue distribution across subscription plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planBreakdown.map((plan, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge className={getPlanColor(plan.plan)}>
                          {plan.plan}
                        </Badge>
                        <div>
                          <p className="font-medium text-shopify-text">{plan.count} customers</p>
                          <p className="text-sm text-gray-500">{plan.percentage}% of total</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-shopify-green">${plan.revenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">${(plan.revenue / plan.count).toFixed(0)}/customer</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest subscription payments and billing activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-shopify-green rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-shopify-text">{transaction.store}</h4>
                        <p className="text-sm text-gray-500 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{transaction.date}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <Badge className={getPlanColor(transaction.plan)}>
                          {transaction.plan}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Plan</p>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-bold text-shopify-green">${transaction.amount}</p>
                        <p className="text-xs text-gray-500">Amount</p>
                      </div>

                      <div className="text-center">
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Status</p>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(`/invoice/${transaction.id}`, '_blank')}>
                          View Invoice
                        </Button>
                        {transaction.status === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => alert('Payment retry initiated for ' + transaction.store)}>
                            Retry Payment
                          </Button>
                        )}
                      </div>
                    </div>
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