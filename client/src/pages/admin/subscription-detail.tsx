import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Calendar, DollarSign, User, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";

export default function AdminSubscriptionDetail() {
  const { subscriptionId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const subscription = {
    id: subscriptionId,
    customer: {
      name: "Sarah Chen",
      email: "sarah@techcorp.com",
      company: "TechCorp Solutions"
    },
    store: {
      name: "TechCorp Solutions",
      domain: "techcorp-solutions.myshopify.com"
    },
    plan: {
      name: "Enterprise",
      price: 199,
      billingCycle: "monthly",
      features: [
        "Unlimited Scans",
        "24/7 Monitoring", 
        "Priority Support",
        "Custom Reports",
        "API Access",
        "White-label Options"
      ]
    },
    status: "active",
    startDate: "2024-01-15",
    nextBilling: "2024-07-15",
    autoRenew: true,
    paymentMethod: {
      type: "Credit Card",
      last4: "4242",
      brand: "Visa",
      expiryDate: "12/26"
    },
    billing: {
      totalPaid: 1194, // 6 months
      lastPayment: {
        amount: 199,
        date: "2024-06-15",
        status: "paid",
        invoiceId: "INV-2024-0615"
      },
      upcomingPayment: {
        amount: 199,
        date: "2024-07-15",
        status: "scheduled"
      }
    },
    usage: {
      scansThisMonth: 89,
      scanLimit: "unlimited",
      storageUsed: "2.4 GB",
      storageLimit: "10 GB",
      apiCallsThisMonth: 1240,
      apiLimit: "unlimited"
    },
    history: [
      { date: "2024-06-15", action: "Payment processed", amount: 199, status: "success" },
      { date: "2024-05-15", action: "Payment processed", amount: 199, status: "success" },
      { date: "2024-04-15", action: "Payment processed", amount: 199, status: "success" },
      { date: "2024-03-15", action: "Payment processed", amount: 199, status: "success" },
      { date: "2024-02-15", action: "Payment processed", amount: 199, status: "success" },
      { date: "2024-01-15", action: "Subscription created", amount: 199, status: "success" }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "trial": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "expired": return "bg-gray-100 text-gray-800";
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
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
              <Button variant="outline" onClick={() => setLocation("/admin/subscriptions")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Subscriptions
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-shopify-text">{subscription.plan.name} Subscription</h1>
                <p className="text-sm text-gray-500">{subscription.customer.company}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Refund Process",
                    description: "Refund processing would be handled here.",
                  });
                }}
              >
                Process Refund
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Plan Update",
                    description: "Plan update options would be displayed here.",
                  });
                }}
              >
                Update Plan
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  toast({
                    title: "Subscription Cancelled",
                    description: "The subscription has been cancelled successfully.",
                    variant: "destructive",
                  });
                }}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Subscription Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-shopify-text mb-3">Customer Information</h4>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Name:</strong> {subscription.customer.name}</p>
                        <p className="text-sm"><strong>Email:</strong> {subscription.customer.email}</p>
                        <p className="text-sm"><strong>Company:</strong> {subscription.customer.company}</p>
                        <p className="text-sm"><strong>Store:</strong> {subscription.store.name}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-shopify-text mb-3">Subscription Details</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm"><strong>Status:</strong></span>
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status}
                          </Badge>
                        </div>
                        <p className="text-sm"><strong>Plan:</strong> {subscription.plan.name}</p>
                        <p className="text-sm"><strong>Price:</strong> ${subscription.plan.price}/{subscription.plan.billingCycle}</p>
                        <p className="text-sm"><strong>Start Date:</strong> {subscription.startDate}</p>
                        <p className="text-sm"><strong>Next Billing:</strong> {subscription.nextBilling}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm"><strong>Auto Renew:</strong></span>
                          <Badge variant={subscription.autoRenew ? "default" : "secondary"}>
                            {subscription.autoRenew ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plan Features</CardTitle>
                  <CardDescription>Features included in the {subscription.plan.name} plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {subscription.plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                  <CardDescription>Current month usage and limits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-lg font-bold text-blue-600">{subscription.usage.scansThisMonth}</p>
                      <p className="text-xs text-gray-600">Scans Used</p>
                      <p className="text-xs text-gray-500">Limit: {subscription.usage.scanLimit}</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <p className="text-lg font-bold text-purple-600">{subscription.usage.storageUsed}</p>
                      <p className="text-xs text-gray-600">Storage Used</p>
                      <p className="text-xs text-gray-500">Limit: {subscription.usage.storageLimit}</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <p className="text-lg font-bold text-green-600">{subscription.usage.apiCallsThisMonth}</p>
                      <p className="text-xs text-gray-600">API Calls</p>
                      <p className="text-xs text-gray-500">Limit: {subscription.usage.apiLimit}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>Payment and subscription activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {subscription.history.map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            event.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <p className="font-medium text-sm">{event.action}</p>
                            <p className="text-xs text-gray-500">{event.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {event.amount && (
                            <p className="font-medium">${event.amount}</p>
                          )}
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Payment Method</h4>
                      <div className="flex items-center space-x-2 p-2 border rounded">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{subscription.paymentMethod.brand} •••• {subscription.paymentMethod.last4}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Expires: {subscription.paymentMethod.expiryDate}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Last Payment</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm">Amount:</span>
                          <span className="font-medium">${subscription.billing.lastPayment.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Date:</span>
                          <span className="text-sm">{subscription.billing.lastPayment.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Status:</span>
                          <Badge className={getStatusColor(subscription.billing.lastPayment.status)}>
                            {subscription.billing.lastPayment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Next Payment</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm">Amount:</span>
                          <span className="font-medium">${subscription.billing.upcomingPayment.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Date:</span>
                          <span className="text-sm">{subscription.billing.upcomingPayment.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-green-50 rounded">
                      <p className="text-xl font-bold text-green-600">${subscription.billing.totalPaid}</p>
                      <p className="text-xs text-gray-600">Total Revenue</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Monthly Revenue:</span>
                        <span className="font-medium">${subscription.plan.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Customer Since:</span>
                        <span className="text-sm">{subscription.startDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Payments Made:</span>
                        <span className="text-sm">{subscription.history.filter(h => h.action.includes('Payment')).length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => setLocation(`/admin/revenue?subscription=${subscriptionId}`)}
                    >
                      View Invoices
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Payment Method",
                          description: "Payment method update form would be displayed here.",
                        });
                      }}
                    >
                      Update Payment Method
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Change Plan",
                          description: "Plan change options would be displayed here.",
                        });
                      }}
                    >
                      Change Plan
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Subscription Paused",
                          description: "The subscription has been paused successfully.",
                        });
                      }}
                    >
                      Pause Subscription
                    </Button>
                    <Button 
                      className="w-full bg-shopify-green hover:bg-shopify-green-dark"
                      onClick={() => {
                        toast({
                          title: "Contacting Customer",
                          description: "Opening customer contact options...",
                        });
                      }}
                    >
                      Contact Customer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}