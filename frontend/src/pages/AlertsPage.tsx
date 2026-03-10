import React from 'react';
import { AlertList } from '../components/alerts/AlertList';
import { useAlerts } from '../hooks/useAlerts';

const AlertsPage: React.FC = () => {
  const { data, isLoading } = useAlerts({ status: 'active' });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Alerts
      </h1>
      <AlertList alerts={data?.items ?? []} isLoading={isLoading} />
    </div>
  );
};

export default AlertsPage;

