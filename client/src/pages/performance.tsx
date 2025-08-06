import { useQuery, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useShopifyAuth } from "@/hooks/use-shopify-auth";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import type { PerformanceMetric } from "@shared/schema";

export default function Performance() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLatestScan, setShowLatestScan] = useState(true); // Toggle between latest scan and 30-day average
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get session data from authentication hook
  const { session, isLoading: sessionLoading, isAuthenticated } = useShopifyAuth();

  // Set storeId when session is available
  if (session?.storeId && !storeId) {
    setStoreId(session.storeId);
  }

  const { data: performanceData, isLoading, error } = useQuery({
    queryKey: ["/api/performance", storeId],
    enabled: !!storeId,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
  });

  const metrics = performanceData?.currentMetrics;
  const trends = performanceData?.trends;
  const latestScanInfo = performanceData?.latestScanInfo;
  const thirtyDayAverages = performanceData?.thirtyDayAverages;

  const getMetricStatus = (value: number, good: number, needs: number) => {
    if (value <= good) return { status: 'Good', color: 'text-green-600', bgColor: 'bg-green-500' };
    if (value <= needs) return { status: 'Needs improvement', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
    return { status: 'Poor', color: 'text-red-600', bgColor: 'bg-red-500' };
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["/api/performance", storeId] });
      toast({
        title: "Performance Data Refreshed",
        description: "Latest performance metrics have been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh performance data.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show loading state while getting session
  if (sessionLoading) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading store information...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no store found
  if (!storeId || !isAuthenticated) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">Store Not Found</div>
                <div className="text-gray-600 mb-4">Unable to find your store information.</div>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-shopify-green text-white px-4 py-2 rounded-lg hover:bg-shopify-green-dark"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <p className="text-shopify-text">Loading performance data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2 text-red-600">Error Loading Performance Data</div>
                <div className="text-gray-600 mb-4">Unable to load performance metrics.</div>
                <button 
                  onClick={handleRefresh}
                  className="bg-shopify-green text-white px-4 py-2 rounded-lg hover:bg-shopify-green-dark"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use real data or show no data state
  const lcp = metrics?.lcp ? (typeof metrics.lcp === 'string' ? parseFloat(metrics.lcp) : metrics.lcp) : null;
  const fcp = metrics?.fcp ? (typeof metrics.fcp === 'string' ? parseFloat(metrics.fcp) : metrics.fcp) : null;
  const cls = metrics?.cls ? (typeof metrics.cls === 'string' ? parseFloat(metrics.cls) : metrics.cls) : null;
  const overallScore = metrics?.overallScore || null;

  // Handle NaN values
  const validLcp = lcp && !isNaN(lcp) ? lcp : null;
  const validFcp = fcp && !isNaN(fcp) ? fcp : null;
  const validCls = cls && !isNaN(cls) ? cls : null;
  const validOverallScore = overallScore && !isNaN(overallScore) ? overallScore : null;



  // Show no data state if no metrics available
  if (!metrics) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-shopify-text">Performance Metrics</h1>
                <p className="text-gray-500">
                  {session?.shop && `Performance data for ${session.shop}`}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 bg-shopify-green text-white px-4 py-2 rounded-lg hover:bg-shopify-green-dark disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2 text-gray-600">No Performance Data Available</div>
                <div className="text-gray-500 mb-4">Run a scan to generate performance metrics.</div>
                <button 
                  onClick={handleRefresh}
                  className="bg-shopify-green text-white px-4 py-2 rounded-lg hover:bg-shopify-green-dark"
                >
                  Check for New Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const lcpStatus = getMetricStatus(validLcp, 2.5, 4.0);
  const fcpStatus = getMetricStatus(validFcp, 1.8, 3.0);
  const clsStatus = getMetricStatus(validCls, 0.1, 0.25);

  return (
    <div className="flex h-screen bg-shopify-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-shopify-text">Performance Metrics</h1>
              <p className="text-gray-500">
                {session?.shop && `Performance data for ${session.shop}`}
              </p>
              {latestScanInfo && (
                <div className="text-sm text-gray-400 mt-1">
                  <p>
                    📊 <strong>Latest Scan Data</strong> - {new Date(latestScanInfo.scanTime).toLocaleString()}
                    {latestScanInfo.scanAge > 0 && (
                      <span className="ml-2">({latestScanInfo.scanAge} hours ago)</span>
                    )}
                  </p>
                  {!latestScanInfo.isRecent && (
                    <p className="text-yellow-600 mt-1">
                      ⚠️ Data is from an older scan. Run a new scan for current performance.
                    </p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 bg-shopify-green text-white px-4 py-2 rounded-lg hover:bg-shopify-green-dark disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {/* Overall Score with Toggle */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Overall Performance Score</h2>
              <div className="flex items-center space-x-4">
                {/* Toggle Switch */}
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${showLatestScan ? 'text-blue-600' : 'text-gray-500'}`}>
                    Latest Scan
                  </span>
                  <button
                    onClick={() => setShowLatestScan(!showLatestScan)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      showLatestScan ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showLatestScan ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${!showLatestScan ? 'text-blue-600' : 'text-gray-500'}`}>
                    30-Day Average
                  </span>
                </div>
                
                {/* Trend Indicator */}
                {trends?.overallScore && (
                  <div className="flex items-center space-x-1">
                    {trends.overallScore.trend === 'improving' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-xs text-gray-500">
                      {trends.overallScore.trend === 'improving' ? 'Improving' : 'Worsening'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Dynamic Content Based on Toggle */}
            <div className="text-center">
              <div className="mb-3">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {showLatestScan ? 'Latest Scan' : '30-Day Average'}
                </h3>
                <p className="text-sm text-gray-500">
                  {showLatestScan 
                    ? (latestScanInfo ? `Scanned ${latestScanInfo.scanAge > 0 ? `${latestScanInfo.scanAge} hours ago` : 'recently'}` : 'No recent scan')
                    : (thirtyDayAverages ? `Based on ${thirtyDayAverages.scanCount} scans` : 'No historical data')
                  }
                </p>
              </div>
              <div className="relative inline-block">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  {showLatestScan ? (
                    validOverallScore !== null && (
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - validOverallScore / 100)}`}
                        className={`${validOverallScore >= 90 ? 'text-green-500' : validOverallScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}
                      />
                    )
                  ) : (
                    thirtyDayAverages?.overallScore && (
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - thirtyDayAverages.overallScore / 100)}`}
                        className={`${thirtyDayAverages.overallScore >= 90 ? 'text-green-500' : thirtyDayAverages.overallScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}
                      />
                    )
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {showLatestScan 
                      ? (validOverallScore !== null ? validOverallScore : 'N/A')
                      : (thirtyDayAverages?.overallScore ? Math.round(thirtyDayAverages.overallScore) : 'N/A')
                    }
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {showLatestScan 
                  ? (validOverallScore === null ? 'No data available' : 
                     validOverallScore >= 90 ? 'Excellent' : validOverallScore >= 50 ? 'Good' : 'Needs Improvement')
                  : (thirtyDayAverages?.overallScore ? 
                     (thirtyDayAverages.overallScore >= 90 ? 'Excellent' : thirtyDayAverages.overallScore >= 50 ? 'Good' : 'Needs Improvement') : 
                     'No data available')
                }
              </p>
            </div>
          </div>

          {/* Core Web Vitals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* LCP */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Largest Contentful Paint</h3>
                <div className="flex items-center space-x-2">
                  {trends?.lcp && (
                    <div className="flex items-center space-x-1">
                      {trends.lcp.trend === 'improving' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                  {showLatestScan ? (
                    validLcp !== null && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${lcpStatus.color} ${lcpStatus.bgColor} bg-opacity-10`}>
                        {lcpStatus.status}
                      </span>
                    )
                  ) : (
                    thirtyDayAverages?.lcp && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMetricStatus(thirtyDayAverages.lcp, 2.5, 4.0).color} ${getMetricStatus(thirtyDayAverages.lcp, 2.5, 4.0).bgColor} bg-opacity-10`}>
                        {getMetricStatus(thirtyDayAverages.lcp, 2.5, 4.0).status}
                      </span>
                    )
                  )}
                </div>
              </div>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {showLatestScan 
                    ? (validLcp !== null ? `${validLcp}s` : 'N/A')
                    : (thirtyDayAverages?.lcp ? `${thirtyDayAverages.lcp.toFixed(2)}s` : 'N/A')
                  }
                </div>
                <p className="text-sm text-gray-500">
                  {showLatestScan ? 'Latest Scan' : '30-Day Average'}
                </p>
              </div>
              
              <p className="text-sm text-gray-500 mb-3">Target: &lt; 2.5s</p>
              
              {(showLatestScan ? validLcp !== null : thirtyDayAverages?.lcp) && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Good</span>
                    <span>Needs improvement</span>
                    <span>Poor</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${showLatestScan ? lcpStatus.bgColor : getMetricStatus(thirtyDayAverages?.lcp || 0, 2.5, 4.0).bgColor}`}
                      style={{ width: `${Math.min(((showLatestScan ? validLcp : thirtyDayAverages?.lcp) || 0) / 4.0 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* FCP */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">First Contentful Paint</h3>
                <div className="flex items-center space-x-2">
                  {trends?.fcp && (
                    <div className="flex items-center space-x-1">
                      {trends.fcp.trend === 'improving' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                  {showLatestScan ? (
                    validFcp !== null && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${fcpStatus.color} ${fcpStatus.bgColor} bg-opacity-10`}>
                        {fcpStatus.status}
                      </span>
                    )
                  ) : (
                    thirtyDayAverages?.fcp && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMetricStatus(thirtyDayAverages.fcp, 1.8, 3.0).color} ${getMetricStatus(thirtyDayAverages.fcp, 1.8, 3.0).bgColor} bg-opacity-10`}>
                        {getMetricStatus(thirtyDayAverages.fcp, 1.8, 3.0).status}
                      </span>
                    )
                  )}
                </div>
              </div>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {showLatestScan 
                    ? (validFcp !== null ? `${validFcp}s` : 'N/A')
                    : (thirtyDayAverages?.fcp ? `${thirtyDayAverages.fcp.toFixed(2)}s` : 'N/A')
                  }
                </div>
                <p className="text-sm text-gray-500">
                  {showLatestScan ? 'Latest Scan' : '30-Day Average'}
                </p>
              </div>
              
              <p className="text-sm text-gray-500 mb-3">Target: &lt; 1.8s</p>
              
              {(showLatestScan ? validFcp !== null : thirtyDayAverages?.fcp) && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Good</span>
                    <span>Needs improvement</span>
                    <span>Poor</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${showLatestScan ? fcpStatus.bgColor : getMetricStatus(thirtyDayAverages?.fcp || 0, 1.8, 3.0).bgColor}`}
                      style={{ width: `${Math.min(((showLatestScan ? validFcp : thirtyDayAverages?.fcp) || 0) / 3.0 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* CLS */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Cumulative Layout Shift</h3>
                <div className="flex items-center space-x-2">
                  {trends?.cls && (
                    <div className="flex items-center space-x-1">
                      {trends.cls.trend === 'improving' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                  {showLatestScan ? (
                    validCls !== null && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${clsStatus.color} ${clsStatus.bgColor} bg-opacity-10`}>
                        {clsStatus.status}
                      </span>
                    )
                  ) : (
                    thirtyDayAverages?.cls && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMetricStatus(thirtyDayAverages.cls, 0.1, 0.25).color} ${getMetricStatus(thirtyDayAverages.cls, 0.1, 0.25).bgColor} bg-opacity-10`}>
                        {getMetricStatus(thirtyDayAverages.cls, 0.1, 0.25).status}
                      </span>
                    )
                  )}
                </div>
              </div>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {showLatestScan 
                    ? (validCls !== null ? validCls : 'N/A')
                    : (thirtyDayAverages?.cls ? thirtyDayAverages.cls.toFixed(3) : 'N/A')
                  }
                </div>
                <p className="text-sm text-gray-500">
                  {showLatestScan ? 'Latest Scan' : '30-Day Average'}
                </p>
              </div>
              
              <p className="text-sm text-gray-500 mb-3">Target: &lt; 0.1</p>
              
              {(showLatestScan ? validCls !== null : thirtyDayAverages?.cls) && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Good</span>
                    <span>Needs improvement</span>
                    <span>Poor</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${showLatestScan ? clsStatus.bgColor : getMetricStatus(thirtyDayAverages?.cls || 0, 0.1, 0.25).bgColor}`}
                      style={{ width: `${Math.min(((showLatestScan ? validCls : thirtyDayAverages?.cls) || 0) / 0.25 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Performance Recommendations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Performance Recommendations</h2>
              {latestScanInfo && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Based on latest scan
                </span>
              )}
            </div>
            <div className="space-y-3">
              {validLcp !== null && validLcp > 2.5 && (
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Optimize Largest Contentful Paint</h4>
                    <p className="text-sm text-gray-600">Your LCP of {validLcp}s is above the recommended 2.5s. Consider optimizing images and reducing server response times.</p>
                  </div>
                </div>
              )}
              {validFcp !== null && validFcp > 1.8 && (
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Improve First Contentful Paint</h4>
                    <p className="text-sm text-gray-600">Your FCP of {validFcp}s is above the recommended 1.8s. Consider reducing render-blocking resources.</p>
                  </div>
                </div>
              )}
              {validCls !== null && validCls > 0.1 && (
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Reduce Cumulative Layout Shift</h4>
                    <p className="text-sm text-gray-600">Your CLS of {validCls} is above the recommended 0.1. Consider setting explicit dimensions for images and other elements.</p>
                  </div>
                </div>
              )}
              {validLcp !== null && validFcp !== null && validCls !== null && validLcp <= 2.5 && validFcp <= 1.8 && validCls <= 0.1 && (
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Excellent Performance</h4>
                    <p className="text-sm text-gray-600">All Core Web Vitals are within recommended ranges. Keep up the good work!</p>
                  </div>
                </div>
              )}
              {(!validLcp || !validFcp || !validCls) && (
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">No Performance Data Available</h4>
                    <p className="text-sm text-gray-600">Run a scan to generate performance metrics and get personalized recommendations.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}