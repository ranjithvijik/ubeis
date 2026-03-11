import React from 'react';
import { AlertList } from '../components/alerts/AlertList';
import { useAlerts } from '../hooks/useAlerts';

const AlertsPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useAlerts({ status: 'active' });

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Alerts</h1>
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
          <p className="font-medium">Could not load alerts</p>
          <p className="text-sm mt-1">{error?.message ?? 'Please ensure you are logged in and try again.'}</p>
          <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-medium underline">Retry</button>
        </div>
      </div>
    );
  }

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

