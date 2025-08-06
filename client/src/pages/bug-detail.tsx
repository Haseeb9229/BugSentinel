import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Clock, CheckCircle, ExternalLink } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import { useQuery } from "@tanstack/react-query";

export default function BugDetail() {
  const { bugId } = useParams();
  const [, setLocation] = useLocation();

  // Fetch real bug data
  const { data: bug, isLoading } = useQuery({
    queryKey: ["/api/bugs", bugId],
    queryFn: async () => {
      const response = await fetch(`/api/bugs/${bugId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch bug details");
      }
      return response.json();
    },
    enabled: !!bugId
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "info": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "info": return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading bug details...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bug) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Bug not found</div>
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
          <div className="flex items-center space-x-3 mb-6">
            <Button variant="outline" onClick={() => setLocation("/bugs")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bug Reports
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Bug Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getSeverityIcon(bug.severity)}
                      <div>
                        <CardTitle className="text-xl">{bug.title}</CardTitle>
                        <CardDescription>Bug ID: {bug.id}</CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getSeverityColor(bug.severity)}>
                        {bug.severity}
                      </Badge>
                      <Badge className={getStatusColor(bug.status)}>
                        {bug.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-shopify-text mb-2">Description</h4>
                      <p className="text-gray-700">{bug.description}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-shopify-text mb-2">Affected URL</h4>
                      <div className="flex items-center space-x-2">
                        <a href={bug.url} target="_blank" rel="noopener noreferrer" className="text-shopify-green hover:underline flex items-center space-x-1">
                          <span>{bug.url}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-shopify-text mb-2">Detected</h4>
                        <p className="text-sm text-gray-600">{new Date(bug.detectedAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-shopify-text mb-2">Affected Pages</h4>
                        <p className="text-sm text-gray-600">{bug.affectedPages}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Error Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Error Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">HTTP Status</label>
                      <p className="text-sm mt-1">{bug.errorDetails.httpStatus}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Error Message</label>
                      <p className="text-sm mt-1">{bug.errorDetails.errorMessage}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Stack Trace</label>
                      <pre className="text-xs bg-gray-100 p-3 rounded mt-1 overflow-x-auto">{bug.errorDetails.stackTrace}</pre>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Browser Info</label>
                      <p className="text-sm mt-1">{bug.errorDetails.browserInfo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reproduction Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Reproduction Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2">
                    {bug.reproductionSteps.map((step: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700">{step}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* Impact Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle>Impact Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estimated Affected Users</label>
                      <p className="text-lg font-semibold text-shopify-text">{bug.impact.estimatedAffectedUsers.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Page Views</label>
                      <p className="text-lg font-semibold text-shopify-text">{bug.impact.pageViews.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Conversion Impact</label>
                      <p className="text-sm text-red-600">{bug.impact.conversionImpact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Technical Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bug.technicalDetails.imageUrls && bug.technicalDetails.imageUrls.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Affected Image URLs</label>
                        <ul className="text-sm mt-1 space-y-1">
                          {bug.technicalDetails.imageUrls.map((url: string, index: number) => (
                            <li key={index} className="text-red-600">{url}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {bug.technicalDetails.lastWorkingDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Working Date</label>
                        <p className="text-sm mt-1">{bug.technicalDetails.lastWorkingDate}</p>
                      </div>
                    )}
                    {bug.technicalDetails.relatedChanges && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Related Changes</label>
                        <p className="text-sm mt-1">{bug.technicalDetails.relatedChanges}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Resolved
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Clock className="w-4 h-4 mr-2" />
                      Mark In Progress
                    </Button>
                    <Button className="w-full" variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Affected Page
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Bug Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Bug Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type</label>
                      <Badge className="mt-1">{bug.type}</Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Severity</label>
                      <Badge className={`mt-1 ${getSeverityColor(bug.severity)}`}>
                        {bug.severity}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <Badge className={`mt-1 ${getStatusColor(bug.status)}`}>
                        {bug.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Detected At</label>
                      <p className="text-sm mt-1">{new Date(bug.detectedAt).toLocaleDateString()}</p>
                    </div>
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