import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Search, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";

export default function AdminScans() {
  const [, setLocation] = useLocation();
  const scanStats = {
    totalScans: 456789,
    successfulScans: 445623,
    failedScans: 11166,
    avgScanTime: "2.3s",
    scansToday: 15432,
    issuesFound: 2847
  };

  const recentScans = [
    {
      id: "1",
      store: "TechCorp Solutions",
      scanType: "Full Site",
      status: "completed",
      duration: "2.1s",
      issuesFound: 0,
      timestamp: "2 minutes ago",
      plan: "Enterprise"
    },
    {
      id: "2", 
      store: "Fashion Hub",
      scanType: "Performance",
      status: "completed",
      duration: "1.8s",
      issuesFound: 2,
      timestamp: "5 minutes ago",
      plan: "Pro"
    },
    {
      id: "3",
      store: "Sports World",
      scanType: "Link Validation", 
      status: "running",
      duration: "1.2s",
      issuesFound: 0,
      timestamp: "8 minutes ago",
      plan: "Pro"
    },
    {
      id: "4",
      store: "Wellness Store",
      scanType: "Full Site",
      status: "failed",
      duration: "0.5s",
      issuesFound: 0,
      timestamp: "12 minutes ago",
      plan: "Basic"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "running": return <Activity className="w-4 h-4 text-blue-500 animate-spin" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "running": return "bg-blue-100 text-blue-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getScanTypeColor = (type: string) => {
    switch (type) {
      case "Full Site": return "bg-purple-100 text-purple-800";
      case "Performance": return "bg-orange-100 text-orange-800";
      case "Link Validation": return "bg-blue-100 text-blue-800";
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
              <Activity className="w-6 h-6 text-shopify-green" />
              <div>
                <h1 className="text-2xl font-bold text-shopify-text">Scan Management</h1>
                <p className="text-sm text-gray-500">Monitor all scanning activity across stores</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search scans..." className="pl-10 w-80" />
              </div>
              <Button className="bg-shopify-green hover:bg-shopify-green-dark">
                Export Scan Data
              </Button>
            </div>
          </div>

          {/* Scan Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                <Activity className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-green">{scanStats.totalScans.toLocaleString()}</div>
                <p className="text-xs text-gray-500">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful</CardTitle>
                <CheckCircle className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{scanStats.successfulScans.toLocaleString()}</div>
                <p className="text-xs text-gray-500">97.6% success rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <XCircle className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{scanStats.failedScans.toLocaleString()}</div>
                <p className="text-xs text-gray-500">2.4% failure rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Clock className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-purple">{scanStats.avgScanTime}</div>
                <p className="text-xs text-gray-500">Per scan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
                <Activity className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{scanStats.scansToday.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Scans run today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
                <AlertTriangle className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{scanStats.issuesFound.toLocaleString()}</div>
                <p className="text-xs text-gray-500">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Scans */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Scan Activity</CardTitle>
              <CardDescription>Latest scanning activity across all stores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center">
                        {getStatusIcon(scan.status)}
                      </div>
                      <div>
                        <h4 className="font-medium text-shopify-text">{scan.store}</h4>
                        <p className="text-sm text-gray-500">{scan.timestamp}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <Badge className={getScanTypeColor(scan.scanType)}>
                          {scan.scanType}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Scan Type</p>
                      </div>

                      <div className="text-center">
                        <Badge className={getStatusColor(scan.status)}>
                          {scan.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Status</p>
                      </div>

                      <div className="text-center">
                        <p className="font-medium text-shopify-text">{scan.duration}</p>
                        <p className="text-xs text-gray-500">Duration</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          {scan.issuesFound > 0 ? (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          <span className={scan.issuesFound > 0 ? "text-orange-600 font-medium" : "text-green-600"}>
                            {scan.issuesFound}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Issues</p>
                      </div>

                      <div className="text-center">
                        <Badge variant="outline" className="text-xs">{scan.plan}</Badge>
                        <p className="text-xs text-gray-500 mt-1">Plan</p>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setLocation(`/admin/scans/${scan.id}`)}>
                          View Details
                        </Button>
                        {scan.status === "failed" && (
                          <Button variant="outline" size="sm">
                            Retry
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