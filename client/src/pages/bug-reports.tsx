import { useQuery, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  X, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Info,
  Clock,
  Calendar,
  FileText,
  Globe,
  Code,
  Eye
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useShopifyAuth } from "@/hooks/use-shopify-auth";
import type { Bug } from "@shared/schema";

interface BugFilters {
  search: string;
  severity: 'all' | 'critical' | 'warning' | 'info';
  status: 'all' | 'open';
  type: 'all' | 'performance' | 'accessibility' | 'seo' | 'broken_link' | 'javascript_error';
  sortBy: string;
  sortOrder: string;
}

interface BugStats {
  total: number;
  open: number;
  critical: number;
  warning: number;
  info: number;
}

export default function BugReports() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<BugFilters>({
    search: '',
    severity: 'all',
    status: 'all',
    type: 'all',
    sortBy: 'detectedAt',
    sortOrder: 'desc'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    images: boolean;
    pages: boolean;
    errors: boolean;
    logs: boolean;
    opportunities: boolean;
  }>({
    images: false,
    pages: false,
    errors: false,
    logs: false,
    opportunities: false
  });

  const [displayCounts, setDisplayCounts] = useState<{
    images: number;
    pages: number;
    errors: number;
    logs: number;
    opportunities: number;
  }>({
    images: 5,
    pages: 5,
    errors: 3,
    logs: 3,
    opportunities: 3
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get session data from authentication hook
  const { session, isLoading: sessionLoading, isAuthenticated } = useShopifyAuth();

  // Set storeId when session is available
  useEffect(() => {
    if (session?.storeId && !storeId) {
      setStoreId(session.storeId);
    }
  }, [session?.storeId, storeId]);

  // Build query parameters
  const queryParams = new URLSearchParams({
    page: currentPage.toString(),
    limit: '10',
    ...filters
  });

  const { data: bugsData, isLoading, error } = useQuery({
    queryKey: ["/api/bugs", storeId, queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/bugs/${storeId}?${queryParams.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch bugs: ${response.status}`);
      }
      const data = await response.json();
      return data;
    },
    enabled: !!storeId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const bugs = bugsData?.bugs || [];
  const pagination = bugsData?.pagination;
  const stats = bugsData?.stats as BugStats;
  const filterOptions = bugsData?.filters;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'warning':
        return 'bg-yellow-600 text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <Clock className="w-4 h-4" />;
      case 'accessibility':
        return <Info className="w-4 h-4" />;
      case 'seo':
        return <Search className="w-4 h-4" />;
      case 'broken_link':
        return <Globe className="w-4 h-4" />;
      case 'javascript_error':
        return <Code className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleFilterChange = (key: keyof BugFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["/api/bugs", storeId] });
      toast({
        title: "Refreshed",
        description: "Bug reports have been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh bug reports.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewDetails = (bug: Bug) => {
    setSelectedBug(bug);
    // Reset expanded sections when opening a new bug
    setExpandedSections({
      images: false,
      pages: false,
      errors: false,
      logs: false,
      opportunities: false
    });
    // Reset display counts
    resetDisplayCounts();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const loadMore = (section: keyof typeof displayCounts, increment: number = 10) => {
    setDisplayCounts(prev => ({
      ...prev,
      [section]: prev[section] + increment
    }));
  };

  const resetDisplayCounts = () => {
    setDisplayCounts({
      images: 5,
      pages: 5,
      errors: 3,
      logs: 3,
      opportunities: 3
    });
  };

  // Show loading state while getting session
  if (sessionLoading) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopify-green mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to view bug reports.</p>
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
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-shopify-text">Bug Reports</h1>
              <p className="text-gray-500">
                {session?.shop && `Bug reports for ${session.shop}`}
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Issues</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Open Issues</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
                    </div>
                    <Info className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Critical</p>
                      <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Warning</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Info</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
                    </div>
                    <Info className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <Input
                    placeholder="Search bugs..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <Select value={filters.severity} onValueChange={(value) => handleFilterChange('severity', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="accessibility">Accessibility</SelectItem>
                      <SelectItem value="seo">SEO</SelectItem>
                      <SelectItem value="broken_link">Broken Link</SelectItem>
                      <SelectItem value="javascript_error">JavaScript Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bug List */}
          <Card>
            <CardHeader>
              <CardTitle>Bug Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopify-green mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading bugs...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">Failed to load bugs. Please try again.</p>
                </div>
              ) : bugs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No bugs found matching your filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bugs.map((bug: Bug) => (
                    <div key={bug.id} className={`p-4 rounded-lg border ${getSeverityColor(bug.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getSeverityIcon(bug.severity)}
                            {getTypeIcon(bug.type)}
                            <Badge className={`${getSeverityBadge(bug.severity)} capitalize`}>
                              {bug.severity}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {bug.type.replace('_', ' ')}
                            </Badge>
                            <Badge 
                              variant={bug.status === 'open' ? 'destructive' : 'default'}
                              className="capitalize"
                            >
                              {bug.status}
                            </Badge>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{bug.title}</h3>
                          <p className="text-gray-600 mb-4 line-clamp-2">{bug.description}</p>
                          
                          {bug.url && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                              <Globe className="w-4 h-4" />
                              <span className="truncate">Affected URL: {bug.url}</span>
                            </div>
                          )}
                          
                                                     <div className="flex items-center space-x-4 text-xs text-gray-400">
                             <div className="flex items-center space-x-1">
                               <Calendar className="w-3 h-3" />
                               <span>Detected: {bug.detectedAt ? new Date(bug.detectedAt.toString()).toLocaleDateString() : 'Unknown'}</span>
                             </div>
                           </div>
                         </div>
                         
                         <div className="flex space-x-2 ml-4">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleViewDetails(bug)}
                           >
                             <Eye className="w-4 h-4 mr-2" />
                             Details
                           </Button>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalBugs)} of {pagination.totalBugs} bugs
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-500">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                             )}
             </CardContent>
           </Card>

                                                                       {/* Bug Details Dialog */}
             <Dialog open={!!selectedBug} onOpenChange={(open) => !open && setSelectedBug(null)}>
               <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col">
                 {selectedBug && (
                   <>
                    <DialogHeader className="flex-shrink-0 pb-6">
                      <DialogTitle className="flex items-center space-x-3 text-2xl">
                        {getSeverityIcon(selectedBug.severity)}
                        <span className="text-gray-900">{selectedBug.title}</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-8 pr-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                                           {/* Badges Section */}
                      <div className="flex items-center space-x-3">
                        <Badge className={`${getSeverityBadge(selectedBug.severity)} capitalize text-sm px-3 py-1`}>
                          {selectedBug.severity}
                        </Badge>
                        <Badge variant="outline" className="capitalize text-sm px-3 py-1">
                          {selectedBug.type.replace('_', ' ')}
                        </Badge>
                        <Badge 
                          variant={selectedBug.status === 'open' ? 'destructive' : 'default'}
                          className="capitalize text-sm px-3 py-1"
                        >
                          {selectedBug.status}
                        </Badge>
                      </div>
                      
                      {/* Description Section */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                        <p className="text-gray-700 leading-relaxed">{selectedBug.description}</p>
                      </div>
                     
                                                                  {/* Detailed Information */}
                       {selectedBug.details && (
                         <div className="bg-white border border-gray-200 rounded-lg p-6">
                           <h4 className="text-lg font-semibold text-gray-900 mb-6">Detailed Information</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                         {selectedBug.details.metric && (
                               <div className="bg-gray-50 rounded-lg p-4">
                                 <div className="text-base font-medium text-gray-600 mb-2">Metric</div>
                                 <div className="text-xl font-semibold text-gray-900">{selectedBug.details.metric}</div>
                               </div>
                             )}
                             
                             {selectedBug.details.value !== undefined && (
                               <div className="bg-gray-50 rounded-lg p-4">
                                 <div className="text-base font-medium text-gray-600 mb-2">Current Value</div>
                                 <div className="text-xl font-semibold text-gray-900">{selectedBug.details.value}</div>
                               </div>
                             )}
                             
                             {selectedBug.details.threshold !== undefined && (
                               <div className="bg-gray-50 rounded-lg p-4">
                                 <div className="text-base font-medium text-gray-600 mb-2">Threshold</div>
                                 <div className="text-xl font-semibold text-gray-900">{selectedBug.details.threshold}</div>
                               </div>
                             )}
                             
                             {selectedBug.details.improvement && (
                               <div className="bg-green-50 rounded-lg p-4">
                                 <div className="text-base font-medium text-green-600 mb-2">Required Improvement</div>
                                 <div className="text-xl font-semibold text-green-700">{selectedBug.details.improvement}</div>
                               </div>
                             )}
                             
                             {selectedBug.details.recommendation && (
                               <div className="bg-blue-50 rounded-lg p-4">
                                 <div className="text-base font-medium text-blue-600 mb-2">Recommendation</div>
                                 <div className="text-xl font-semibold text-blue-900">{selectedBug.details.recommendation}</div>
                               </div>
                             )}
                            
                                                         {selectedBug.details.recommendations && Array.isArray(selectedBug.details.recommendations) && (
                               <div className="col-span-2 bg-blue-50 rounded-lg p-4">
                                 <div className="text-base font-medium text-blue-600 mb-3">Recommendations</div>
                                 <ul className="space-y-2">
                                   {selectedBug.details.recommendations.map((rec: string, index: number) => (
                                     <li key={index} className="text-blue-900 text-sm flex items-start">
                                       <span className="text-blue-500 mr-3 mt-1">•</span>
                                       <span className="leading-relaxed">{rec}</span>
                                     </li>
                                   ))}
                                 </ul>
                               </div>
                             )}
                             
                             {selectedBug.details.overallRecommendations && Array.isArray(selectedBug.details.overallRecommendations) && (
                               <div className="col-span-2 bg-green-50 rounded-lg p-4">
                                 <div className="text-base font-medium text-green-600 mb-3">Overall Recommendations</div>
                                 <ul className="space-y-2">
                                   {selectedBug.details.overallRecommendations.map((rec: string, index: number) => (
                                     <li key={index} className="text-green-900 text-sm flex items-start">
                                       <span className="text-green-500 mr-3 mt-1">•</span>
                                       <span className="leading-relaxed">{rec}</span>
                                     </li>
                                   ))}
                                 </ul>
                               </div>
                             )}
                            
                                                                                      {selectedBug.details.affectedPages && (
                               <div className="bg-orange-50 rounded-lg p-4">
                                 <div className="text-base font-medium text-orange-600 mb-2">Affected Pages</div>
                                 <div className="text-xl font-semibold text-orange-900">{selectedBug.details.affectedPages}</div>
                               </div>
                             )}
                             
                             {selectedBug.details.totalLoadTime && (
                               <div className="bg-red-50 rounded-lg p-4">
                                 <div className="text-base font-medium text-red-600 mb-2">Total Load Time</div>
                                 <div className="text-xl font-semibold text-red-900">{selectedBug.details.totalLoadTime}ms</div>
                               </div>
                             )}
                             
                             {selectedBug.details.potentialSavings && (
                               <div className="bg-green-50 rounded-lg p-4">
                                 <div className="text-base font-medium text-green-600 mb-2">Potential Savings</div>
                                 <div className="text-xl font-semibold text-green-900">{selectedBug.details.potentialSavings}ms</div>
                               </div>
                             )}
                             
                             {selectedBug.details.avgLoadTime && (
                               <div className="bg-yellow-50 rounded-lg p-4">
                                 <div className="text-base font-medium text-yellow-600 mb-2">Average Load Time</div>
                                 <div className="text-xl font-semibold text-yellow-900">{selectedBug.details.avgLoadTime}ms</div>
                               </div>
                             )}
                             
                             {selectedBug.details.totalErrors && (
                               <div className="bg-red-50 rounded-lg p-4">
                                 <div className="text-base font-medium text-red-600 mb-2">Total Errors</div>
                                 <div className="text-xl font-semibold text-red-900">{selectedBug.details.totalErrors}</div>
                               </div>
                             )}
                            
                                                         {selectedBug.details.affectedResources && Array.isArray(selectedBug.details.affectedResources) && (
                               <div>
                                 <span className="font-medium text-gray-700">Affected Resources:</span>
                                 <ul className="ml-2 mt-1 space-y-1">
                                   {selectedBug.details.affectedResources.map((resource: string, index: number) => (
                                     <li key={index} className="text-gray-600 text-sm flex items-start">
                                       <span className="text-blue-500 mr-2">•</span>
                                       {resource}
                                     </li>
                                   ))}
                                 </ul>
                               </div>
                             )}
                             
                             {selectedBug.details.resources && Array.isArray(selectedBug.details.resources) && (
                               <div>
                                 <span className="font-medium text-gray-700">Affected Pages:</span>
                                 <div className="ml-2 mt-1 space-y-2">
                                   {selectedBug.details.resources.slice(0, displayCounts.pages).map((page: any, index: number) => (
                                     <div key={index} className="text-gray-600 text-sm border-l-2 border-gray-200 pl-2">
                                       <div className="flex items-center space-x-2">
                                         <span className="font-medium">Page {index + 1}:</span>
                                         {page.loadTime && (
                                           <span className="text-xs bg-red-100 text-red-600 px-1 rounded">{page.loadTime}ms</span>
                                         )}
                                         {page.errorCount && (
                                           <span className="text-xs bg-red-100 text-red-600 px-1 rounded">{page.errorCount} errors</span>
                                         )}
                                         {page.severity && (
                                           <span className={`text-xs px-1 rounded ${page.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                             {page.severity}
                                           </span>
                                         )}
                                       </div>
                                       <div className="text-xs text-gray-500 truncate">{page.url}</div>
                                       {page.title && (
                                         <div className="text-xs text-gray-400">Title: {page.title}</div>
                                       )}
                                       {page.pageSize && (
                                         <div className="text-xs text-gray-400">
                                           Size: {(page.pageSize / 1024).toFixed(2)} KB | Resources: {page.resourceCount}
                                         </div>
                                       )}
                                       {page.potentialSavings && (
                                         <div className="text-xs text-green-600">
                                           Potential savings: {page.potentialSavings}ms
                                         </div>
                                       )}
                                       {page.errors && Array.isArray(page.errors) && page.errors.length > 0 && (
                                         <div className="mt-1">
                                           <div className="text-xs font-medium text-gray-600">Errors:</div>
                                           <div className="ml-2 space-y-1">
                                             {page.errors.slice(0, expandedSections.errors ? undefined : 3).map((error: any, errorIndex: number) => (
                                               <div key={errorIndex} className="text-xs text-red-600">
                                                 <span className="font-medium">{error.type}:</span> {error.message}
                                                 {error.line && error.column && (
                                                   <span className="text-gray-500"> (Line {error.line}:{error.column})</span>
                                                 )}
                                               </div>
                                             ))}
                                             {page.errors.length > 3 && (
                                               <div className="text-xs text-gray-500">
                                                 {expandedSections.errors 
                                                   ? `${page.errors.length} total errors` 
                                                   : `+${page.errors.length - 3} more errors...`
                                                 }
                                               </div>
                                             )}
                                           </div>
                                         </div>
                                       )}
                                       {page.recommendations && Array.isArray(page.recommendations) && (
                                         <div className="mt-1">
                                           <div className="text-xs font-medium text-gray-600">Recommendations:</div>
                                           <ul className="ml-2 space-y-1">
                                             {page.recommendations.slice(0, 2).map((rec: string, recIndex: number) => (
                                               <li key={recIndex} className="text-xs text-gray-600 flex items-start">
                                                 <span className="text-blue-500 mr-1">•</span>
                                                 {rec}
                                               </li>
                                             ))}
                                           </ul>
                                         </div>
                                       )}
                                     </div>
                                   ))}
                                   {selectedBug.details.resources.length > displayCounts.pages && (
                                     <div className="text-center py-2">
                                       <button
                                         onClick={() => loadMore('pages', 10)}
                                         className="text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded px-3 py-1 transition-colors"
                                         disabled={displayCounts.pages >= selectedBug.details.resources.length}
                                       >
                                         {displayCounts.pages >= selectedBug.details.resources.length 
                                           ? `All ${selectedBug.details.resources.length} Pages Shown` 
                                           : `Show ${Math.min(10, selectedBug.details.resources.length - displayCounts.pages)} More Pages...`
                                         }
                                       </button>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             )}
                            
                            {selectedBug.details.impact && (
                              <div>
                                <span className="font-medium text-gray-700">Impact:</span>
                                <span className="ml-2 text-gray-600">{selectedBug.details.impact}</span>
                              </div>
                            )}
                            
                            {selectedBug.details.priority && (
                              <div>
                                <span className="font-medium text-gray-700">Priority:</span>
                                <span className="ml-2 text-gray-600">{selectedBug.details.priority}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                       {/* Technical Details - Only show if there's relevant data */}
                       {selectedBug.details && (
                         (selectedBug.details.pageSize || 
                          selectedBug.details.resourceCount || 
                          selectedBug.details.totalImages || 
                          selectedBug.details.totalMissing ||
                          (selectedBug.details.imageDetails && Array.isArray(selectedBug.details.imageDetails) && selectedBug.details.imageDetails.length > 0)) && (
                           <div className="bg-white border border-gray-200 rounded-lg p-6">
                             <h4 className="text-lg font-semibold text-gray-900 mb-6">Technical Details</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               {selectedBug.details.pageSize && (
                                 <div className="bg-gray-50 rounded-lg p-4">
                                   <div className="text-base font-medium text-gray-600 mb-2">Page Size</div>
                                   <div className="text-xl font-semibold text-gray-900">{(selectedBug.details.pageSize / 1024).toFixed(2)} KB</div>
                                 </div>
                               )}
                               
                               {selectedBug.details.resourceCount && (
                                 <div className="bg-gray-50 rounded-lg p-4">
                                   <div className="text-base font-medium text-gray-600 mb-2">Resource Count</div>
                                   <div className="text-xl font-semibold text-gray-900">{selectedBug.details.resourceCount} resources</div>
                                 </div>
                               )}
                               
                               {selectedBug.details.totalImages && (
                                 <div className="bg-gray-50 rounded-lg p-4">
                                   <div className="text-base font-medium text-gray-600 mb-2">Total Images</div>
                                   <div className="text-xl font-semibold text-gray-900">{selectedBug.details.totalImages} images</div>
                                 </div>
                               )}
                               
                               {selectedBug.details.totalMissing && (
                                 <div className="bg-red-50 rounded-lg p-4">
                                   <div className="text-base font-medium text-red-600 mb-2">Missing Alt Texts</div>
                                   <div className="text-xl font-semibold text-red-900">{selectedBug.details.totalMissing} images</div>
                                 </div>
                               )}
                             </div>
                             
                             {/* Image Details Section */}
                             {selectedBug.details.imageDetails && Array.isArray(selectedBug.details.imageDetails) && selectedBug.details.imageDetails.length > 0 && (
                               <div className="mt-8">
                                 <h5 className="text-lg font-semibold text-gray-900 mb-6">Image Details</h5>
                                 <div className="space-y-6">
                                   {selectedBug.details.imageDetails.slice(0, displayCounts.images).map((img: any, index: number) => (
                                     <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                                       {/* Header */}
                                       <div className="flex items-center justify-between mb-4">
                                         <h6 className="text-lg font-semibold text-gray-900">Image {index + 1}</h6>
                                         <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                           Missing Alt
                                         </span>
                                       </div>
                                       
                                       {/* Image URL */}
                                       <div className="mb-4">
                                         <div className="text-sm font-medium text-gray-700 mb-2">Image URL:</div>
                                         <div className="text-sm text-gray-600 break-all bg-gray-50 p-3 rounded">
                                           {img.src}
                                         </div>
                                       </div>
                                       
                                       {/* Image Preview */}
                                       <div className="mb-4">
                                         <div className="text-sm font-medium text-gray-700 mb-2">Image Preview:</div>
                                         <div className="flex items-center space-x-4">
                                           <div className="w-20 h-20 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                                             <img 
                                               src={img.src} 
                                               alt="Preview" 
                                               className="max-w-full max-h-full object-contain"
                                               onError={(e) => {
                                                 e.currentTarget.style.display = 'none';
                                                 e.currentTarget.nextElementSibling!.style.display = 'flex';
                                               }}
                                             />
                                             <div className="hidden text-sm text-gray-400 items-center justify-center">
                                               <span>No Preview</span>
                                             </div>
                                           </div>
                                           <div className="flex-1">
                                             <div className="text-sm text-gray-600 mb-1">
                                               <span className="font-medium">Dimensions:</span> {img.width}×{img.height}px
                                             </div>
                                             <div className="text-sm text-gray-600 mb-1">
                                               <span className="font-medium">Display Size:</span> {img.displayWidth}×{img.displayHeight}px
                                             </div>
                                             <div className="text-sm text-gray-600">
                                               <span className="font-medium">Visibility:</span> 
                                               <span className={`ml-1 ${img.isVisible ? 'text-green-600' : 'text-red-600'}`}>
                                                 {img.isVisible ? 'Visible' : 'Hidden'}
                                               </span>
                                             </div>
                                           </div>
                                         </div>
                                       </div>
                                       
                                       {/* Page Information */}
                                       {img.pageTitle && (
                                         <div className="mb-3">
                                           <div className="text-sm font-medium text-gray-700 mb-1">Page:</div>
                                           <div className="text-sm text-gray-600">{img.pageTitle}</div>
                                         </div>
                                       )}
                                       
                                       {/* Position */}
                                       {img.position && (
                                         <div className="mb-3">
                                           <div className="text-sm font-medium text-gray-700 mb-1">Position:</div>
                                           <div className="text-sm text-gray-600">
                                             ({img.position.x}, {img.position.y})
                                           </div>
                                         </div>
                                       )}
                                       
                                       {/* Parent Element */}
                                       {img.parentElement && (
                                         <div className="mb-3">
                                           <div className="text-sm font-medium text-gray-700 mb-1">Parent Element:</div>
                                           <div className="text-sm text-gray-600">{img.parentElement}</div>
                                         </div>
                                       )}
                                       
                                       {/* Context - Only show if context exists */}
                                       {img.context && img.context.trim() && (
                                         <div className="mb-3">
                                           <div className="text-sm font-medium text-gray-700 mb-1">Context:</div>
                                           <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                             {img.context}
                                           </div>
                                         </div>
                                       )}
                                       
                                       {/* CSS Classes */}
                                       {img.cssClasses && (
                                         <div className="mb-3">
                                           <div className="text-sm font-medium text-gray-700 mb-1">CSS Classes:</div>
                                           <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                             {img.cssClasses}
                                           </div>
                                         </div>
                                       )}
                                       
                                       {/* Recommendations */}
                                       <div className="mt-4 pt-4 border-t border-gray-200">
                                         <div className="text-sm font-medium text-gray-700 mb-3">Recommendations:</div>
                                         <ul className="space-y-2">
                                           <li className="text-sm text-gray-600 flex items-start">
                                             <span className="text-blue-500 mr-3 mt-1">•</span>
                                             <span className="leading-relaxed">Add descriptive alt text for this {img.width}×{img.height} image</span>
                                           </li>
                                           <li className="text-sm text-gray-600 flex items-start">
                                             <span className="text-blue-500 mr-3 mt-1">•</span>
                                             <span className="leading-relaxed">Consider if this {img.isVisible ? 'visible' : 'hidden'} image needs alt=""</span>
                                           </li>
                                           {img.context && img.context.trim() && (
                                             <li className="text-sm text-gray-600 flex items-start">
                                               <span className="text-blue-500 mr-3 mt-1">•</span>
                                               <span className="leading-relaxed">Context suggests: "{img.context.substring(0, 50)}..."</span>
                                             </li>
                                           )}
                                         </ul>
                                       </div>
                                     </div>
                                   ))}
                                   {selectedBug.details.imageDetails.length > displayCounts.images && (
                                     <div className="text-center py-4">
                                       <button
                                         onClick={() => loadMore('images', 10)}
                                         className="text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg py-3 px-6 transition-colors"
                                         disabled={displayCounts.images >= selectedBug.details.imageDetails.length}
                                       >
                                         {displayCounts.images >= selectedBug.details.imageDetails.length 
                                           ? `All ${selectedBug.details.imageDetails.length} Images Shown` 
                                           : `Show ${Math.min(10, selectedBug.details.imageDetails.length - displayCounts.images)} More Images...`
                                         }
                                       </button>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             )}
                           </div>
                         )
                       )}

                       {/* JavaScript Errors - Only show if there's relevant data */}
                       {selectedBug.details && (
                         (selectedBug.details.jsErrors && Array.isArray(selectedBug.details.jsErrors) && selectedBug.details.jsErrors.length > 0) ||
                         selectedBug.details.errorBreakdown ||
                         selectedBug.details.criticalPages ||
                         (selectedBug.details.consoleLogs && Array.isArray(selectedBug.details.consoleLogs) && selectedBug.details.consoleLogs.length > 0) ||
                         selectedBug.details.pageSpeedAnalysis
                       ) && (
                         <div className="bg-white border border-gray-200 rounded-lg p-6">
                           <h4 className="text-lg font-semibold text-gray-900 mb-6">JavaScript Errors</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {selectedBug.details.jsErrors && Array.isArray(selectedBug.details.jsErrors) && selectedBug.details.jsErrors.length > 0 && (
                               <div>
                                 <div className="text-base font-medium text-gray-700 mb-3">JavaScript Errors:</div>
                                 <ul className="space-y-2">
                                   {selectedBug.details.jsErrors.slice(0, displayCounts.errors).map((error: string, index: number) => (
                                     <li key={index} className="text-red-600 text-sm flex items-start">
                                       <span className="text-red-500 mr-3 mt-1">•</span>
                                       <span className="leading-relaxed">{error}</span>
                                     </li>
                                   ))}
                                 </ul>
                                 {selectedBug.details.jsErrors.length > displayCounts.errors && (
                                   <div className="mt-3">
                                     <button
                                       onClick={() => loadMore('errors', 5)}
                                       className="text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 px-4 transition-colors"
                                       disabled={displayCounts.errors >= selectedBug.details.jsErrors.length}
                                     >
                                       {displayCounts.errors >= selectedBug.details.jsErrors.length 
                                         ? `All ${selectedBug.details.jsErrors.length} Errors Shown` 
                                         : `Show ${Math.min(5, selectedBug.details.jsErrors.length - displayCounts.errors)} More Errors...`
                                       }
                                     </button>
                                   </div>
                                 )}
                               </div>
                             )}
                             
                             {selectedBug.details.errorBreakdown && (
                               <div>
                                 <div className="text-base font-medium text-gray-700 mb-3">Error Breakdown:</div>
                                 <div className="space-y-2">
                                   {Object.entries(selectedBug.details.errorBreakdown).map(([type, count]: [string, any]) => (
                                     <div key={type} className="text-sm text-gray-600">
                                       <span className="font-medium">{type.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                       <span className="ml-2 text-red-600">{count} errors</span>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}
                             
                             {selectedBug.details.criticalPages && (
                               <div>
                                 <div className="text-base font-medium text-gray-700 mb-2">Critical Pages:</div>
                                 <div className="text-sm text-red-600">{selectedBug.details.criticalPages} pages with &gt;3 errors</div>
                               </div>
                             )}
                            
                             {selectedBug.details.consoleLogs && Array.isArray(selectedBug.details.consoleLogs) && selectedBug.details.consoleLogs.length > 0 && (
                               <div>
                                 <div className="text-base font-medium text-gray-700 mb-3">Console Logs:</div>
                                 <ul className="space-y-2">
                                   {selectedBug.details.consoleLogs.slice(0, displayCounts.logs).map((log: string, index: number) => (
                                     <li key={index} className="text-gray-600 text-sm flex items-start">
                                       <span className="text-blue-500 mr-3 mt-1">•</span>
                                       <span className="leading-relaxed">{log}</span>
                                     </li>
                                   ))}
                                 </ul>
                                 {selectedBug.details.consoleLogs.length > displayCounts.logs && (
                                   <div className="mt-3">
                                     <button
                                       onClick={() => loadMore('logs', 5)}
                                       className="text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 px-4 transition-colors"
                                       disabled={displayCounts.logs >= selectedBug.details.consoleLogs.length}
                                     >
                                       {displayCounts.logs >= selectedBug.details.consoleLogs.length 
                                         ? `All ${selectedBug.details.consoleLogs.length} Logs Shown` 
                                         : `Show ${Math.min(5, selectedBug.details.consoleLogs.length - displayCounts.logs)} More Logs...`
                                       }
                                     </button>
                                   </div>
                                 )}
                               </div>
                             )}
                             
                             {selectedBug.details.pageSpeedAnalysis && (
                               <div>
                                 <div className="text-base font-medium text-gray-700 mb-3">PageSpeed Analysis:</div>
                                 <div className="space-y-4">
                                   {selectedBug.details.pageSpeedAnalysis.coreWebVitals && (
                                     <div>
                                       <div className="text-sm font-medium text-gray-600 mb-2">Core Web Vitals:</div>
                                       <div className="space-y-2">
                                         {Object.entries(selectedBug.details.pageSpeedAnalysis.coreWebVitals).map(([metric, data]: [string, any]) => (
                                           <div key={metric} className="text-sm text-gray-600">
                                             <span className="font-medium">{metric.toUpperCase()}:</span> {data.value} ({data.score}) - {data.threshold}
                                           </div>
                                         ))}
                                       </div>
                                     </div>
                                   )}
                                   
                                   {selectedBug.details.pageSpeedAnalysis.performanceMetrics && (
                                     <div>
                                       <div className="text-sm font-medium text-gray-600 mb-2">Performance Metrics:</div>
                                       <div className="space-y-2">
                                         {Object.entries(selectedBug.details.pageSpeedAnalysis.performanceMetrics).map(([metric, value]: [string, any]) => (
                                           <div key={metric} className="text-sm text-gray-600">
                                             <span className="font-medium">{metric}:</span> {value}
                                           </div>
                                         ))}
                                       </div>
                                     </div>
                                   )}
                                   
                                   {selectedBug.details.pageSpeedAnalysis.opportunities && selectedBug.details.pageSpeedAnalysis.opportunities.length > 0 && (
                                     <div>
                                       <div className="text-sm font-medium text-gray-600 mb-2">Optimization Opportunities:</div>
                                       <ul className="space-y-2">
                                         {selectedBug.details.pageSpeedAnalysis.opportunities.slice(0, displayCounts.opportunities).map((opp: any, index: number) => (
                                           <li key={index} className="text-sm text-gray-600 flex items-start">
                                             <span className="text-yellow-500 mr-3 mt-1">•</span>
                                             <span className="leading-relaxed">{opp.title || opp.description}</span>
                                           </li>
                                         ))}
                                       </ul>
                                       {selectedBug.details.pageSpeedAnalysis.opportunities.length > displayCounts.opportunities && (
                                         <div className="mt-3">
                                           <button
                                             onClick={() => loadMore('opportunities', 5)}
                                             className="text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 px-4 transition-colors"
                                             disabled={displayCounts.opportunities >= selectedBug.details.pageSpeedAnalysis.opportunities.length}
                                           >
                                             {displayCounts.opportunities >= selectedBug.details.pageSpeedAnalysis.opportunities.length 
                                               ? `All ${selectedBug.details.pageSpeedAnalysis.opportunities.length} Opportunities Shown` 
                                               : `Show ${Math.min(5, selectedBug.details.pageSpeedAnalysis.opportunities.length - displayCounts.opportunities)} More Opportunities...`
                                             }
                                           </button>
                                         </div>
                                       )}
                                     </div>
                                   )}
                                 </div>
                               </div>
                             )}
                          </div>
                        </div>
                       )}

                      {/* Impact Analysis */}
                      {selectedBug.details && (
                        <div>
                          <h4 className="font-semibold mb-2">Impact Analysis</h4>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            {selectedBug.details.estimatedAffectedUsers && (
                              <div>
                                <span className="font-medium text-gray-700">Estimated Affected Users:</span>
                                <span className="ml-2 text-gray-600">{selectedBug.details.estimatedAffectedUsers.toLocaleString()}</span>
                              </div>
                            )}
                            
                            {selectedBug.details.pageViews && (
                              <div>
                                <span className="font-medium text-gray-700">Page Views:</span>
                                <span className="ml-2 text-gray-600">{selectedBug.details.pageViews.toLocaleString()}</span>
                              </div>
                            )}
                            
                            {selectedBug.details.conversionImpact && (
                              <div>
                                <span className="font-medium text-gray-700">Conversion Impact:</span>
                                <span className="ml-2 text-gray-600">{selectedBug.details.conversionImpact}</span>
                              </div>
                            )}
                            
                            {selectedBug.details.seoImpact && (
                              <div>
                                <span className="font-medium text-gray-700">SEO Impact:</span>
                                <span className="ml-2 text-gray-600">{selectedBug.details.seoImpact}</span>
                              </div>
                            )}
                            
                            {selectedBug.details.performanceImpact && (
                              <div>
                                <span className="font-medium text-gray-700">Performance Impact:</span>
                                <span className="ml-2 text-gray-600">{selectedBug.details.performanceImpact}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Reproduction Steps */}
                      {selectedBug.details && selectedBug.details.reproductionSteps && (
                        <div>
                          <h4 className="font-semibold mb-2">Reproduction Steps</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <ol className="space-y-2">
                              {selectedBug.details.reproductionSteps.map((step: string, index: number) => (
                                <li key={index} className="text-gray-600 text-sm flex items-start">
                                  <span className="font-medium text-gray-700 mr-2">{index + 1}.</span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}
                     
                     {selectedBug.url && (
                       <div>
                         <h4 className="font-semibold mb-2">Affected URL</h4>
                         <div className="flex items-center space-x-2 text-sm text-gray-600">
                           <Globe className="w-4 h-4" />
                           <span className="break-all">{selectedBug.url}</span>
                         </div>
                       </div>
                     )}
                     
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <h4 className="font-semibold mb-1">Detected</h4>
                         <p className="text-gray-600">
                           {selectedBug.detectedAt ? new Date(selectedBug.detectedAt.toString()).toLocaleString() : 'Unknown'}
                         </p>
                       </div>
                     </div>
                   </div>
                 </>
               )}
             </DialogContent>
           </Dialog>
         </div>
       </div>
     </div>
   );
 } 