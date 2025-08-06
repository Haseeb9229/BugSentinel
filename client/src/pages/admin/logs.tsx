import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";

export default function AdminLogs() {
  const logs = [
    {
      id: "1",
      timestamp: "2024-06-28 13:45:32",
      level: "info",
      message: "Scan completed for TechCorp Solutions",
      details: "Full site scan completed successfully. 0 issues found."
    },
    {
      id: "2",
      timestamp: "2024-06-28 13:44:15",
      level: "warning", 
      message: "High response time detected",
      details: "Fashion Hub response time: 3.2s (threshold: 3.0s)"
    },
    {
      id: "3",
      timestamp: "2024-06-28 13:42:08",
      level: "error",
      message: "Scan failed for Wellness Store",
      details: "Connection timeout after 30s. Retrying in 5 minutes."
    },
    {
      id: "4",
      timestamp: "2024-06-28 13:40:55",
      level: "info",
      message: "New store installation",
      details: "Beauty Essentials successfully installed Bug Patrol"
    }
  ];

  const getLogIcon = (level: string) => {
    switch (level) {
      case "info": return <Info className="w-4 h-4 text-blue-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error": return <XCircle className="w-4 h-4 text-red-500" />;
      case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case "info": return "bg-blue-100 text-blue-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "error": return "bg-red-100 text-red-800";
      case "success": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex h-screen bg-shopify-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-6 h-6 text-shopify-green" />
            <div>
              <h1 className="text-2xl font-bold text-shopify-text">System Logs</h1>
              <p className="text-sm text-gray-500">Monitor system activity and errors</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent System Activity</CardTitle>
              <CardDescription>Latest system logs and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                    {getLogIcon(log.level)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getLogColor(log.level)}>
                          {log.level}
                        </Badge>
                        <span className="text-xs text-gray-500">{log.timestamp}</span>
                      </div>
                      <h4 className="font-medium text-shopify-text mb-1">{log.message}</h4>
                      <p className="text-sm text-gray-600">{log.details}</p>
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