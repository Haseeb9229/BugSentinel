import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity, Clock, CheckCircle, AlertTriangle, Globe, Database } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";

export default function AdminScanDetail() {
  const { scanId } = useParams();
  const [, setLocation] = useLocation();

  const scan = {
    id: scanId,
    store: "TechCorp Solutions",
    storeId: "store-1",
    type: "Full Site",
    status: "completed",
    startTime: "2024-06-28 14:30:00",
    endTime: "2024-06-28 14:32:15",
    duration: "2 minutes 15 seconds",
    pagesScanned: 156,
    issuesFound: 3,
    performance: {
      avgLoadTime: 2.1,
      largestContentfulPaint: 1.8,
      firstContentfulPaint: 0.9,
      cumulativeLayoutShift: 0.05
    },
    issues: [
      {
        id: "1",
        type: "broken_link",
        severity: "critical",
        title: "Product image 404 errors",
        description: "12 product images return 404 not found errors",
        affectedPages: 12,
        url: "/collections/electronics"
      },
      {
        id: "2", 
        type: "performance",
        severity: "warning",
        title: "Slow loading JavaScript",
        description: "Large JavaScript bundles causing slow page loads",
        affectedPages: 45,
        url: "/assets/app.js"
      },
      {
        id: "3",
        type: "js_error",
        severity: "warning", 
        title: "Console JavaScript errors",
        description: "Multiple JS errors in checkout flow",
        affectedPages: 3,
        url: "/checkout"
      }
    ],
    scanDetails: {
      crawledUrls: 156,
      blockedUrls: 2,
      timeoutUrls: 0,
      errorUrls: 15,
      avgResponseTime: 847,
      dataTransferred: "2.4 MB",
      requestsMade: 1247
    },
    technicalMetrics: {
      domainAuthority: 67,
      sslCertificate: "Valid",
      mobileFriendly: true,
      seoScore: 85,
      accessibilityScore: 78,
      securityScore: 92
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "running": return "bg-blue-100 text-blue-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex h-screen bg-shopify-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => setLocation("/admin/scans")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Scans
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-shopify-text">{scan.type} Scan</h1>
                <p className="text-sm text-gray-500">{scan.store} • {scan.startTime}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                Export Report
              </Button>
              <Button variant="outline">
                Re-run Scan
              </Button>
              <Button className="bg-shopify-green hover:bg-shopify-green-dark">
                View Store
              </Button>
            </div>
          </div>

          {/* Scan Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <CheckCircle className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <Badge className={getStatusColor(scan.status)}>{scan.status}</Badge>
                <p className="text-xs text-gray-500 mt-1">{scan.duration}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pages Scanned</CardTitle>
                <Globe className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-shopify-green">{scan.pagesScanned}</div>
                <p className="text-xs text-gray-500">Total pages</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
                <AlertTriangle className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{scan.issuesFound}</div>
                <p className="text-xs text-gray-500">Need attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
                <Clock className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{scan.performance.avgLoadTime}s</div>
                <p className="text-xs text-gray-500">Response time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SEO Score</CardTitle>
                <Database className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(scan.technicalMetrics.seoScore)}`}>
                  {scan.technicalMetrics.seoScore}
                </div>
                <p className="text-xs text-gray-500">Out of 100</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Issues Found */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Issues Identified</CardTitle>
                  <CardDescription>Problems found during the scan that require attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scan.issues.map((issue) => (
                      <div key={issue.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className={`w-4 h-4 ${
                              issue.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
                            }`} />
                            <h4 className="font-medium">{issue.title}</h4>
                          </div>
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Affected pages: {issue.affectedPages}</span>
                          <span>URL: {issue.url}</span>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <Button size="sm" variant="outline">View Details</Button>
                          <Button size="sm" variant="outline">Create Bug Report</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Core Web Vitals and performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-lg font-bold text-blue-600">{scan.performance.avgLoadTime}s</p>
                      <p className="text-xs text-gray-600">Avg Load Time</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <p className="text-lg font-bold text-green-600">{scan.performance.largestContentfulPaint}s</p>
                      <p className="text-xs text-gray-600">LCP</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <p className="text-lg font-bold text-purple-600">{scan.performance.firstContentfulPaint}s</p>
                      <p className="text-xs text-gray-600">FCP</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <p className="text-lg font-bold text-orange-600">{scan.performance.cumulativeLayoutShift}</p>
                      <p className="text-xs text-gray-600">CLS</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Scan Details</CardTitle>
                  <CardDescription>Technical details about the scanning process</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">URLs</h4>
                      <div className="space-y-1">
                        <p className="text-xs">Crawled: {scan.scanDetails.crawledUrls}</p>
                        <p className="text-xs">Blocked: {scan.scanDetails.blockedUrls}</p>
                        <p className="text-xs">Errors: {scan.scanDetails.errorUrls}</p>
                        <p className="text-xs">Timeouts: {scan.scanDetails.timeoutUrls}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Performance</h4>
                      <div className="space-y-1">
                        <p className="text-xs">Avg Response: {scan.scanDetails.avgResponseTime}ms</p>
                        <p className="text-xs">Data Transfer: {scan.scanDetails.dataTransferred}</p>
                        <p className="text-xs">Requests: {scan.scanDetails.requestsMade}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Timing</h4>
                      <div className="space-y-1">
                        <p className="text-xs">Started: {scan.startTime}</p>
                        <p className="text-xs">Ended: {scan.endTime}</p>
                        <p className="text-xs">Duration: {scan.duration}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quality Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">SEO Score</span>
                      <span className={`font-bold ${getScoreColor(scan.technicalMetrics.seoScore)}`}>
                        {scan.technicalMetrics.seoScore}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Accessibility</span>
                      <span className={`font-bold ${getScoreColor(scan.technicalMetrics.accessibilityScore)}`}>
                        {scan.technicalMetrics.accessibilityScore}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Security</span>
                      <span className={`font-bold ${getScoreColor(scan.technicalMetrics.securityScore)}`}>
                        {scan.technicalMetrics.securityScore}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Domain Authority</span>
                      <span className="font-bold text-blue-600">{scan.technicalMetrics.domainAuthority}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Checks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">SSL Certificate</span>
                      <Badge className="bg-green-100 text-green-800">Valid</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Mobile Friendly</span>
                      <Badge className="bg-green-100 text-green-800">Yes</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">HTTPS Enabled</span>
                      <Badge className="bg-green-100 text-green-800">Yes</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Sitemap Found</span>
                      <Badge className="bg-green-100 text-green-800">Yes</Badge>
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
                    <Button className="w-full" variant="outline">
                      Download Full Report
                    </Button>
                    <Button className="w-full" variant="outline">
                      Schedule Follow-up
                    </Button>
                    <Button className="w-full" variant="outline">
                      Compare with Previous
                    </Button>
                    <Button className="w-full bg-shopify-green hover:bg-shopify-green-dark">
                      Run New Scan
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