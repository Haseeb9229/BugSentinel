interface StatsOverviewProps {
  stats: {
    storeHealth: number;
    activeIssues: number;
    criticalIssues: number;
    warningIssues: number;
    uptime: number;
    pageSpeed?: number;
    pageSpeedTrend?: number;
  };
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-shopify-surface p-6 rounded-xl border border-shopify-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Store Health</p>
            <p className="text-2xl font-semibold text-shopify-success">{stats.storeHealth}%</p>
          </div>
          <div className="w-12 h-12 bg-shopify-success bg-opacity-10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-shopify-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <svg className="w-4 h-4 text-shopify-success mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-shopify-success">+2% from last week</span>
        </div>
      </div>

      <div className="bg-shopify-surface p-6 rounded-xl border border-shopify-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Active Issues</p>
            <p className="text-2xl font-semibold text-shopify-critical">{stats.activeIssues}</p>
          </div>
          <div className="w-12 h-12 bg-shopify-critical bg-opacity-10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-shopify-critical" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-gray-500">{stats.criticalIssues} critical, {stats.warningIssues} warning</span>
        </div>
      </div>

      <div className="bg-shopify-surface p-6 rounded-xl border border-shopify-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Page Speed</p>
            <p className="text-2xl font-semibold text-shopify-warning">
              {stats.pageSpeed ? `${stats.pageSpeed.toFixed(1)}s` : 'N/A'}
            </p>
          </div>
          <div className="w-12 h-12 bg-shopify-warning bg-opacity-10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-shopify-warning" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          {stats.pageSpeedTrend !== undefined && stats.pageSpeedTrend !== null ? (
            <>
              {stats.pageSpeedTrend > 0 ? (
                <svg className="w-4 h-4 text-shopify-critical mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-shopify-success mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span className={stats.pageSpeedTrend > 0 ? 'text-shopify-critical' : 'text-shopify-success'}>
                {stats.pageSpeedTrend > 0 ? '+' : ''}{stats.pageSpeedTrend.toFixed(1)}s {stats.pageSpeedTrend > 0 ? 'slower' : 'faster'}
              </span>
            </>
          ) : (
            <span className="text-gray-500">No trend data</span>
          )}
        </div>
      </div>

      <div className="bg-shopify-surface p-6 rounded-xl border border-shopify-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Uptime</p>
            <p className="text-2xl font-semibold text-shopify-success">{stats.uptime}%</p>
          </div>
          <div className="w-12 h-12 bg-shopify-success bg-opacity-10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-shopify-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-gray-500">30 days average</span>
        </div>
      </div>
    </div>
  );
}
