import React from 'react';
import { DashboardSummary } from '../components/dashboard/DashboardSummary';
import { KPICard } from '../components/dashboard/KPICard';
import { useDashboard } from '../hooks/useDashboard';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { data, isLoading } = useDashboard({ period: 'monthly', category: 'all' });
  const navigate = useNavigate();

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
          {data?.kpis.map((kpi) => (
            <KPICard
              key={kpi.kpiId}
              kpi={kpi}
              onClick={() => navigate(`/kpis/${kpi.kpiId}`)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;

