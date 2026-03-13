import React from 'react';
import { KPICard } from '../components/dashboard/KPICard';
import { useDashboard } from '../hooks/useDashboard';
import { useNavigate, useLocation } from 'react-router-dom';
import type { KPIStatus } from '../types';

const KPIsPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useDashboard({ period: 'monthly', category: 'all' });
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const search = (params.get('search') || '').trim().toLowerCase();
  const statusParam = (params.get('status') as KPIStatus | null) || null;

  const allKpis = data?.kpis ?? [];
  const filteredKpis = allKpis.filter((kpi) => {
    const name = kpi.name?.toLowerCase() ?? '';
    const category = kpi.category?.toLowerCase() ?? '';
    const matchesSearch = search ? name.includes(search) || category.includes(search) : true;
    const matchesStatus = statusParam ? kpi.status === statusParam : true;
    return matchesSearch && matchesStatus;
  });

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500 dark:text-gray-400">Loading KPIs…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
        <p className="font-medium">Could not load KPIs</p>
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
    <div className="space-y-3 sm:space-y-4">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
        All KPIs
      </h1>
      {(search || statusParam) && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing
          {search && (
            <>
              {' '}results for <span className="font-medium">"{search}"</span>
            </>
          )}
          {statusParam && (
            <>
              {' '}with status{' '}
              <span className="font-medium">
                {statusParam === 'on_target'
                  ? 'On Target'
                  : statusParam === 'at_risk'
                    ? 'At Risk'
                    : 'Below Target'}
              </span>
            </>
          )}
          {' '}({filteredKpis.length} KPI{filteredKpis.length === 1 ? '' : 's'}).
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {filteredKpis.map((kpi) => (
          <KPICard
            key={kpi.kpiId}
            kpi={kpi}
            onClick={() => navigate(`/kpis/${kpi.kpiId}`)}
          />
        ))}
        {!isLoading && filteredKpis.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No KPIs found. Seed sample data (e.g. <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">npm run seed-data</code>) with <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">DYNAMODB_TABLE=UniversityOfBaltimore-EIS-Data-dev</code>.</p>
        )}
      </div>
    </div>
  );
};

export default KPIsPage;

