import { CheckCircle, AlertTriangle, Clock } from "lucide-react";
import type { Scan } from "@shared/schema";

interface ScanActivityProps {
  scans: Scan[];
  nextScanTime?: string | null;
}

export default function ScanActivity({ scans, nextScanTime }: ScanActivityProps) {
  // Limit to 5 recent scans
  const recentScans = scans.slice(0, 5);
  
  // Format scheduled time
  const getScheduledTime = () => {
    if (!nextScanTime) return 'Not scheduled';
    
    const nextScan = new Date(nextScanTime);
    const now = new Date();
    
    // Format as "Today at 7:57 PM" or "Tomorrow at 7:57 PM"
    const isToday = nextScan.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === nextScan.toDateString();
    
    const timeString = nextScan.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    if (isToday) {
      return `Today at ${timeString}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${timeString}`;
    } else {
      return nextScan.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
      });
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-shopify-success" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-shopify-critical" />;
      case 'running':
        return <Clock className="w-4 h-4 text-shopify-warning animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-shopify-success bg-opacity-10';
      case 'failed':
        return 'bg-shopify-critical bg-opacity-10';
      case 'running':
        return 'bg-shopify-warning bg-opacity-10';
      default:
        return 'bg-gray-100';
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const formatScanType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="bg-shopify-surface rounded-xl border border-shopify-border">
      <div className="px-6 py-4 border-b border-shopify-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-shopify-text">Scan Activity</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-shopify-success rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">Active</span>
          </div>
        </div>
      </div>
      <div className="p-6">
        {recentScans.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No scan activity yet. Start your first scan!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentScans.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusBg(scan.status)}`}>
                    {getStatusIcon(scan.status)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{formatScanType(scan.type)}</p>
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(scan.startedAt?.toString() || null)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-shopify-text">
                    {scan.pagesScanned || 0} pages
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDuration(scan.duration)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-shopify-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Next automated scan</span>
            <span className="font-medium text-shopify-text">{getScheduledTime()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
