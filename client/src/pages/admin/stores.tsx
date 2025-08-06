import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store, Search, Globe, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function AdminStores() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch real stores data
  const { data: stores, isLoading } = useQuery({
    queryKey: ["/api/admin/stores"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stores");
      if (!response.ok) {
        throw new Error("Failed to fetch admin stores");
      }
      return response.json();
    }
  });

  // Filter stores based on search term
  const filteredStores = stores?.filter((store: any) =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.owner.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
      case "enterprise": return "bg-purple-100 text-purple-800";
      case "pro": return "bg-blue-100 text-blue-800";
      case "basic": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getUptimeColor = (uptime: string) => {
    const uptimeNum = parseFloat(uptime);
    if (uptimeNum >= 99.5) return "text-green-600";
    if (uptimeNum >= 99.0) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading stores...</div>
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
            <div>
              <h1 className="text-2xl font-bold text-shopify-text">Store Management</h1>
              <p className="text-gray-500">Manage all store installations and their status</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Globe className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button className="bg-shopify-green hover:bg-shopify-green-dark">
                <Store className="w-4 h-4 mr-2" />
                Add Store
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search stores by name, domain, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Stores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store: any) => (
              <Card key={store.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation(`/admin/stores/${store.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-shopify-green rounded-lg flex items-center justify-center">
                        <Store className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{store.name}</CardTitle>
                        <CardDescription className="truncate">{store.domain}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge className={getStatusColor(store.status)}>
                        {store.status}
                      </Badge>
                      <Badge className={getPlanColor(store.plan)}>
                        {store.plan}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Owner:</span>
                      <span className="font-medium">{store.owner}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Revenue:</span>
                      <span className="font-medium text-shopify-green">{store.revenue}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Uptime:</span>
                      <span className={`font-medium ${getUptimeColor(store.uptime)}`}>
                        {store.uptime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Scans:</span>
                      <span className="font-medium">{store.totalScans}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Critical Issues:</span>
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className={`w-4 h-4 ${store.criticalIssues > 0 ? 'text-red-500' : 'text-green-500'}`} />
                        <span className={`font-medium ${store.criticalIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {store.criticalIssues}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Last Scan:</span>
                      <span className="font-medium">{store.lastScan}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Installed {store.installDate}</span>
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/admin/stores/${store.id}`);
                      }}>
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStores.length === 0 && (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
              <p className="text-gray-500">
                {searchTerm ? "Try adjusting your search terms" : "No stores have been installed yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}