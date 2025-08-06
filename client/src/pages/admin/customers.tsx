import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Mail, Phone, CreditCard, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";

export default function AdminCustomers() {
  const [, setLocation] = useLocation();
  const customers = [
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah@techcorp.com",
      company: "TechCorp Solutions",
      plan: "Enterprise",
      joinedDate: "2024-01-15",
      lastLogin: "2 hours ago",
      totalRevenue: 1794,
      status: "active"
    },
    {
      id: "2", 
      name: "Michael Chen",
      email: "michael@fashionhub.com",
      company: "Fashion Hub",
      plan: "Pro",
      joinedDate: "2024-02-20",
      lastLogin: "1 day ago",
      totalRevenue: 890,
      status: "active"
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      email: "emily@sportsworld.com", 
      company: "Sports World",
      plan: "Pro",
      joinedDate: "2024-03-10",
      lastLogin: "3 days ago",
      totalRevenue: 623,
      status: "active"
    },
    {
      id: "4",
      name: "David Thompson",
      email: "david@wellness.com",
      company: "Wellness Store",
      plan: "Basic",
      joinedDate: "2024-03-25",
      lastLogin: "1 week ago",
      totalRevenue: 145,
      status: "trial"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "trial": return "bg-blue-100 text-blue-800";
      case "inactive": return "bg-red-100 text-red-800";
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
              <Users className="w-6 h-6 text-shopify-green" />
              <div>
                <h1 className="text-2xl font-bold text-shopify-text">Customer Management</h1>
                <p className="text-sm text-gray-500">Manage all customers who installed Bug Patrol</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search customers..." className="pl-10 w-80" />
              </div>
              <Button className="bg-shopify-green hover:bg-shopify-green-dark">
                Export Data
              </Button>
            </div>
          </div>

          {/* Customer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-green">1,247</div>
                <p className="text-xs text-gray-500">+127 this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <Users className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">1,189</div>
                <p className="text-xs text-gray-500">95.3% retention rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trial Customers</CardTitle>
                <Users className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">89</div>
                <p className="text-xs text-gray-500">7.1% conversion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Revenue/Customer</CardTitle>
                <CreditCard className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-green">$19.71</div>
                <p className="text-xs text-gray-500">+$2.15 from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Customer List */}
          <Card>
            <CardHeader>
              <CardTitle>All Customers</CardTitle>
              <CardDescription>Complete list of customers with their subscription details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-shopify-green rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-shopify-text">{customer.name}</h4>
                        <p className="text-sm text-gray-500 flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{customer.email}</span>
                        </p>
                        <p className="text-xs text-gray-400">{customer.company}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <Badge className={getPlanColor(customer.plan)}>
                          {customer.plan}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Plan</p>
                      </div>

                      <div className="text-center">
                        <p className="font-medium text-shopify-green">${customer.totalRevenue}</p>
                        <p className="text-xs text-gray-500">Total Revenue</p>
                      </div>

                      <div className="text-center">
                        <Badge className={getStatusColor(customer.status)}>
                          {customer.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{customer.lastLogin}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-gray-600 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {customer.joinedDate}
                        </p>
                        <p className="text-xs text-gray-500">Joined</p>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setLocation(`/admin/customers/${customer.id}`)}>
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${customer.email}`)}>
                          Contact
                        </Button>
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