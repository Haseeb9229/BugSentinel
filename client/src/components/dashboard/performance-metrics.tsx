import type { PerformanceMetric } from "@shared/schema";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PerformanceMetricsProps {
  metrics?: PerformanceMetric;
  trends?: {
    lcp?: { trend: 'improving' | 'worsening' };
    fcp?: { trend: 'improving' | 'worsening' };
    cls?: { trend: 'improving' | 'worsening' };
    overallScore?: { trend: 'improving' | 'worsening' };
  };
}

export default function PerformanceMetrics({ metrics, trends }: PerformanceMetricsProps) {
  // Use latest scan data or show N/A if no data
  const lcp = metrics?.lcp ? parseFloat(metrics.lcp) : null;
  const fcp = metrics?.fcp ? parseFloat(metrics.fcp) : null;
  const cls = metrics?.cls ? parseFloat(metrics.cls) : null;
  const overallScore = metrics?.overallScore || null;
  


  const getMetricStatus = (value: number, good: number, needs: number) => {
    if (value <= good) return { status: 'Good', color: 'text-green-600', bgColor: 'bg-green-500' };
    if (value <= needs) return { status: 'Needs improvement', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
    return { status: 'Poor', color: 'text-red-600', bgColor: 'bg-red-500' };
  };

  const lcpStatus = lcp ? getMetricStatus(lcp, 2.5, 4.0) : { status: 'No Data', color: 'text-gray-500', bgColor: 'bg-gray-300' };
  const fcpStatus = fcp ? getMetricStatus(fcp, 1.8, 3.0) : { status: 'No Data', color: 'text-gray-500', bgColor: 'bg-gray-300' };
  const clsStatus = cls ? getMetricStatus(cls, 0.1, 0.25) : { status: 'No Data', color: 'text-gray-500', bgColor: 'bg-gray-300' };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="bg-shopify-surface rounded-xl border border-shopify-border">
      <div className="px-6 py-4 border-b border-shopify-border">
        <h3 className="text-lg font-semibold text-shopify-text">Performance Metrics</h3>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {/* Core Web Vitals */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Largest Contentful Paint (LCP)</span>
              <div className="flex items-center space-x-2">
                {trends?.lcp && (
                  <div className="flex items-center space-x-1">
                    {trends.lcp.trend === 'improving' ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                )}
                {lcp && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${lcpStatus.color} ${lcpStatus.bgColor} bg-opacity-10`}>
                    {lcpStatus.status}
                  </span>
                )}
                <span className={`text-sm font-semibold ${lcpStatus.color}`}>
                  {lcp ? `${lcp}s` : 'N/A'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-2">Target: &lt; 2.5s</p>
            <div className="w-full bg-gray-200 rounded-full h-2 relative">
              <div className={`${lcpStatus.bgColor} h-2 rounded-full transition-all duration-300`} style={{ 
                width: lcp ? `${Math.min(Math.max((lcp / 4.0) * 100, 0), 100)}%` : '0%' 
              }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Good</span>
              <span>Needs improvement</span>
              <span>Poor</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">First Contentful Paint (FCP)</span>
              <div className="flex items-center space-x-2">
                {trends?.fcp && (
                  <div className="flex items-center space-x-1">
                    {trends.fcp.trend === 'improving' ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                )}
                {fcp && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${fcpStatus.color} ${fcpStatus.bgColor} bg-opacity-10`}>
                    {fcpStatus.status}
                  </span>
                )}
                <span className={`text-sm font-semibold ${fcpStatus.color}`}>
                  {fcp ? `${fcp}s` : 'N/A'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-2">Target: &lt; 1.8s</p>
            <div className="w-full bg-gray-200 rounded-full h-2 relative">
              <div className={`${fcpStatus.bgColor} h-2 rounded-full transition-all duration-300`} style={{ 
                width: fcp ? `${Math.min(Math.max((fcp / 3.0) * 100, 0), 100)}%` : '0%' 
              }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Good</span>
              <span>Needs improvement</span>
              <span>Poor</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Cumulative Layout Shift (CLS)</span>
              <div className="flex items-center space-x-2">
                {trends?.cls && (
                  <div className="flex items-center space-x-1">
                    {trends.cls.trend === 'improving' ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                )}
                {cls && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${clsStatus.color} ${clsStatus.bgColor} bg-opacity-10`}>
                    {clsStatus.status}
                  </span>
                )}
                <span className={`text-sm font-semibold ${clsStatus.color}`}>
                  {cls ? cls : 'N/A'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-2">Target: &lt; 0.1</p>
            <div className="w-full bg-gray-200 rounded-full h-2 relative">
              <div className={`${clsStatus.bgColor} h-2 rounded-full transition-all duration-300`} style={{ 
                width: cls ? `${Math.min(Math.max((cls / 0.25) * 100, 0), 100)}%` : '0%' 
              }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Good</span>
              <span>Needs improvement</span>
              <span>Poor</span>
            </div>
          </div>

          {/* Page Speed Score */}
          <div className="pt-4 border-t border-shopify-border">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-2">Overall Performance Score</p>
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 relative">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" stroke="#E5E7EB" strokeWidth="8" fill="none"/>
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="28" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        fill="none" 
                        strokeDasharray="175.929" 
                        strokeDashoffset={175.929 - (175.929 * overallScore / 100)} 
                        strokeLinecap="round"
                        className={getScoreColor(overallScore)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-lg font-bold ${overallScore ? getScoreColor(overallScore) : 'text-gray-500'}`}>
                        {overallScore || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className={`font-semibold ${overallScore ? getScoreColor(overallScore) : 'text-gray-500'}`}>
                      {overallScore ? getScoreStatus(overallScore) : 'No Data'}
                    </p>
                    <p className="text-xs text-gray-500">Based on Core Web Vitals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
