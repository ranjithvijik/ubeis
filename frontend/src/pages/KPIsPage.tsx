import React from 'react';
import { KPICard } from '../components/dashboard/KPICard';
import { useDashboard } from '../hooks/useDashboard';
import { useNavigate } from 'react-router-dom';

const KPIsPage: React.FC = () => {
  const { data, isLoading } = useDashboard({ period: 'monthly', category: 'all' });
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        All KPIs
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.kpis.map((kpi) => (
          <KPICard
            key={kpi.kpiId}
            kpi={kpi}
            onClick={() => navigate(`/kpis/${kpi.kpiId}`)}
          />
        ))}
        {!isLoading && !data?.kpis.length && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No KPIs found.</p>
        )}
      </div>
    </div>
  );
};

export default KPIsPage;

