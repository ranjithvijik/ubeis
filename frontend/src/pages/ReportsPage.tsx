import React from 'react';

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Reports
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Reports generation and history will appear here. Connect to the Reports API to list and
        trigger exports.
      </p>
    </div>
  );
};

export default ReportsPage;

