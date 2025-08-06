import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Store, Calendar, CreditCard, Activity, AlertTriangle, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";

export default function AdminCustomerDetail() {
  const { customerId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Mock customer data - would come from API in real implementation
  const customer = {
    id: customerId,
    name: "Sarah Chen",
    email: "sarah@techcorp.com", 
    phone: "+1 (555) 123-4567",
    company: "TechCorp Solutions",
    role: "Store Manager",
    store: {
      id: "store-1",
      name: "TechCorp Solutions", 
      domain: "techcorp-solutions.myshopify.com",
      plan: "Enterprise",
      status: "active",
      setupDate: "2024-01-15"
    },
    subscription: {
      plan: "Enterprise",
      status: "active",
      startDate: "2024-01-15",
      nextBilling: "2024-07-15",
      amount: 199,
      autoRenew: true
    },
    activity: {
      lastLogin: "2 hours ago",
      totalLogins: 124,
      bugsReported: 12,
      scansRun: 89,
      issuesResolved: 8
    },
    recentBugs: [
      { id: "1", title: "Broken checkout flow", severity: "critical", status: "resolved", date: "2024-06-25" },
      { id: "2", title: "Slow page load times", severity: "warning", status: "open", date: "2024-06-20" },
      { id: "3", title: "Mobile navigation issue", severity: "warning", status: "in_progress", date: "2024-06-18" }
    ],
    recentScans: [
      { id: "1", type: "Full Site", date: "2024-06-28", status: "completed", issues: 0 },
      { id: "2", type: "Performance", date: "2024-06-27", status: "completed", issues: 2 },
      { id: "3", type: "Link Check", date: "2024-06-26", status: "completed", issues: 1 }
    ],
    support: {
      totalTickets: 5,
      openTickets: 1,
      avgResponseTime: "2.5 hours",
      satisfaction: 4.8
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "trial": return "bg-blue-100 text-blue-800"; 
      case "cancelled": return "bg-red-100 text-red-800";
      case "expired": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "info": return "bg-blue-100 text-blue-800";
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
              <Button variant="outline" onClick={() => setLocation("/admin/customers")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Customers
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-shopify-text">{customer.name}</h1>
                <p className="text-sm text-gray-500">{customer.company}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Phone className="w-4 h-4 mr-2" />
                Call Customer
              </Button>
              <Button variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Cancel Subscription
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-shopify-text mb-3">Contact Details</h4>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Name:</strong> {customer.name}</p>
                        <p className="text-sm"><strong>Email:</strong> {customer.email}</p>
                        <p className="text-sm"><strong>Phone:</strong> {customer.phone}</p>
                        <p className="text-sm"><strong>Role:</strong> {customer.role}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-shopify-text mb-3">Store Information</h4>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Store:</strong> {customer.store.name}</p>
                        <p className="text-sm"><strong>Domain:</strong> {customer.store.domain}</p>
                        <p className="text-sm"><strong>Setup Date:</strong> {customer.store.setupDate}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(customer.store.status)}>
                            {customer.store.status}
                          </Badge>
                          <Badge variant="outline">{customer.store.plan}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-2xl font-bold text-blue-600">{customer.activity.totalLogins}</p>
                      <p className="text-xs text-gray-600">Total Logins</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <p className="text-2xl font-bold text-green-600">{customer.activity.scansRun}</p>
                      <p className="text-xs text-gray-600">Scans Run</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <p className="text-2xl font-bold text-orange-600">{customer.activity.bugsReported}</p>
                      <p className="text-xs text-gray-600">Bugs Reported</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <p className="text-2xl font-bold text-purple-600">{customer.activity.issuesResolved}</p>
                      <p className="text-xs text-gray-600">Issues Resolved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Bugs */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bug Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {customer.recentBugs.map((bug) => (
                      <div key={bug.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <h4 className="font-medium">{bug.title}</h4>
                          <p className="text-sm text-gray-500">{bug.date}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(bug.severity)}>{bug.severity}</Badge>
                          <Badge className={getStatusColor(bug.status)}>{bug.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Scans */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Scans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {customer.recentScans.map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <h4 className="font-medium">{scan.type} Scan</h4>
                          <p className="text-sm text-gray-500">{scan.date}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-center">
                            <p className="font-medium">{scan.issues}</p>
                            <p className="text-xs text-gray-500">Issues</p>
                          </div>
                          <Badge className={getStatusColor(scan.status)}>{scan.status}</Badge>
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
                  <CardTitle>Subscription Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Plan:</span>
                      <Badge variant="outline">{customer.subscription.plan}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status:</span>
                      <Badge className={getStatusColor(customer.subscription.status)}>
                        {customer.subscription.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Amount:</span>
                      <span className="font-medium">${customer.subscription.amount}/mo</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Next Billing:</span>
                      <span className="text-sm">{customer.subscription.nextBilling}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto Renew:</span>
                      <Badge variant={customer.subscription.autoRenew ? "default" : "secondary"}>
                        {customer.subscription.autoRenew ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Support Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-green-50 rounded">
                      <p className="text-xl font-bold text-green-600">{customer.support.satisfaction}</p>
                      <p className="text-xs text-gray-600">Satisfaction Score</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="font-bold">{customer.support.totalTickets}</p>
                        <p className="text-xs text-gray-600">Total Tickets</p>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <p className="font-bold">{customer.support.openTickets}</p>
                        <p className="text-xs text-gray-600">Open Tickets</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-center">Avg Response: {customer.support.avgResponseTime}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => setLocation(`/admin/stores/${customerId}`)}
                    >
                      View Store Details
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Manual Scan Started",
                          description: "Running comprehensive scan for this store...",
                        });
                      }}
                    >
                      Run Manual Scan
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => setLocation(`/admin/scans?store=${customerId}`)}
                    >
                      View All Tickets
                    </Button>
                    <Button 
                      className="w-full bg-shopify-green hover:bg-shopify-green-dark"
                      onClick={() => {
                        toast({
                          title: "Upgrade Plan",
                          description: "Plan upgrade options would be displayed here.",
                        });
                      }}
                    >
                      Upgrade Plan
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