import React from 'react';
import { useParams } from 'react-router-dom';
import { useKPIDetail } from '../hooks/useKPIDetail';
import { KPICard } from '../components/dashboard/KPICard';

const KPIDetailPage: React.FC = () => {
  const { kpiId } = useParams<{ kpiId: string }>();
  const { data, isLoading } = useKPIDetail(kpiId!);

  if (!kpiId) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No KPI selected.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading KPI...</p>;
  }

  if (!data) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">KPI not found.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        {data.name}
      </h1>
      <KPICard kpi={data} />
      {/* Charts / history could go here based on design docs */}
    </div>
  );
};

export default KPIDetailPage;

