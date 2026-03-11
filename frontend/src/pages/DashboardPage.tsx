import React from 'react';
import { DashboardSummary } from '../components/dashboard/DashboardSummary';
import { KPICard } from '../components/dashboard/KPICard';
import { useDashboard } from '../hooks/useDashboard';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useDashboard({ period: 'monthly', category: 'all' });
  const navigate = useNavigate();

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500 dark:text-gray-400">Loading dashboard…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
        <p className="font-medium">Could not load dashboard</p>
        <p className="text-sm mt-1">{error?.message ?? 'Please ensure you are logged in and try again.'}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 text-sm font-medium underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data && (
        <DashboardSummary summary={data.summary} isLoading={isLoading} />
      )}

      <section className="mt-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.kpis?.map((kpi) => (
            <KPICard
              key={kpi.kpiId}
              kpi={kpi}
              onClick={() => navigate(`/kpis/${kpi.kpiId}`)}
            />
          ))}
        </div>
        {data && !isLoading && data.kpis.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No KPIs to display. Seed sample data or add KPIs.</p>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;

