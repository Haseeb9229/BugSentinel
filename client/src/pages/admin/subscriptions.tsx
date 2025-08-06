import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, CreditCard, Users, TrendingUp, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";

export default function AdminSubscriptions() {
  const [, setLocation] = useLocation();
  const subscriptionStats = {
    totalSubscriptions: 1247,
    activeSubscriptions: 1189,
    trialSubscriptions: 89,
    cancelledThisMonth: 29,
    mrr: 22145,
    churnRate: 2.3
  };

  const subscriptions = [
    {
      id: "1",
      store: "TechCorp Solutions",
      plan: "Enterprise",
      status: "active",
      startDate: "2024-01-15",
      nextBilling: "2024-07-15",
      amount: 199,
      autoRenew: true
    },
    {
      id: "2",
      store: "Fashion Hub",
      plan: "Pro",
      status: "active", 
      startDate: "2024-02-20",
      nextBilling: "2024-07-20",
      amount: 89,
      autoRenew: true
    },
    {
      id: "3",
      store: "Sports World",
      plan: "Pro",
      status: "active",
      startDate: "2024-03-10",
      nextBilling: "2024-07-10", 
      amount: 89,
      autoRenew: false
    },
    {
      id: "4",
      store: "Wellness Store",
      plan: "Basic",
      status: "trial",
      startDate: "2024-06-25",
      nextBilling: "2024-07-25",
      amount: 29,
      autoRenew: false
    }
  ];

  return (
    <div className="flex h-screen bg-shopify-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-shopify-green" />
              <div>
                <h1 className="text-2xl font-bold text-shopify-text">Subscription Management</h1>
                <p className="text-sm text-gray-500">Manage all customer subscriptions and billing</p>
              </div>
            </div>
            <Button className="bg-shopify-green hover:bg-shopify-green-dark">
              Export Subscriptions
            </Button>
          </div>

          {/* Subscription Stats */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                <Users className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-green">{subscriptionStats.totalSubscriptions}</div>
                <p className="text-xs text-gray-500">All plans</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <CreditCard className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{subscriptionStats.activeSubscriptions}</div>
                <p className="text-xs text-gray-500">95.3% retention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trials</CardTitle>
                <Calendar className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{subscriptionStats.trialSubscriptions}</div>
                <p className="text-xs text-gray-500">Active trials</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                <TrendingUp className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-green">${subscriptionStats.mrr.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Monthly recurring</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <TrendingUp className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{subscriptionStats.churnRate}%</div>
                <p className="text-xs text-gray-500">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                <CreditCard className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{subscriptionStats.cancelledThisMonth}</div>
                <p className="text-xs text-gray-500">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Subscriptions List */}
          <Card>
            <CardHeader>
              <CardTitle>All Subscriptions</CardTitle>
              <CardDescription>Manage customer subscriptions and billing details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-shopify-green rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-shopify-text">{subscription.store}</h4>
                        <p className="text-sm text-gray-500">Started: {subscription.startDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <Badge className={subscription.plan === 'Enterprise' ? 'bg-purple-100 text-purple-800' : 
                                         subscription.plan === 'Pro' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                          {subscription.plan}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">${subscription.amount}/mo</p>
                      </div>

                      <div className="text-center">
                        <Badge className={subscription.status === 'active' ? 'bg-green-100 text-green-800' : 
                                         subscription.status === 'trial' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                          {subscription.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Status</p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-medium text-shopify-text">{subscription.nextBilling}</p>
                        <p className="text-xs text-gray-500">Next billing</p>
                      </div>

                      <div className="text-center">
                        <Badge variant={subscription.autoRenew ? 'default' : 'secondary'}>
                          {subscription.autoRenew ? 'Auto-renew' : 'Manual'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Renewal</p>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setLocation(`/admin/subscriptions/${subscription.id}`)}>
                          Manage
                        </Button>
                        {subscription.status === 'trial' && (
                          <Button variant="outline" size="sm">
                            Convert
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