import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import type { Bug } from "@shared/schema";

interface RecentIssuesProps {
  bugs: Bug[];
}

export default function RecentIssues({ bugs }: RecentIssuesProps) {
  const [, setLocation] = useLocation();
  
  // Limit to 5 recent issues
  const recentBugs = bugs.slice(0, 5);
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-l-4 border-shopify-critical';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-shopify-warning';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-shopify-critical text-white';
      case 'warning':
        return 'bg-shopify-warning text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const formatTimeAgo = (dateString: string) => {
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

  return (
    <div className="bg-shopify-surface rounded-xl border border-shopify-border">
      <div className="px-6 py-4 border-b border-shopify-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-shopify-text">Recent Issues</h3>
          <button 
            onClick={() => setLocation('/bugs')}
            className="text-shopify-green hover:text-green-600 text-sm font-medium"
          >
            View All
          </button>
        </div>
      </div>
      <div className="p-6">
        {recentBugs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No issues detected. Your store is running smoothly!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentBugs.map((bug) => (
              <div key={bug.id} className={`flex items-start space-x-4 p-4 rounded-lg ${getSeverityColor(bug.severity)}`}>
                <div className="flex-shrink-0">
                  <Badge className={`${getSeverityBadge(bug.severity)} capitalize`}>
                    {bug.severity}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-shopify-text">{bug.title}</p>
                  <p className="text-sm text-gray-500">{bug.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {bug.detectedAt ? formatTimeAgo(bug.detectedAt.toString()) : 'Unknown time'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
