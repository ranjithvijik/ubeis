import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Settings
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        User and application settings will be managed here (theme, notifications, profile).
      </p>
    </div>
  );
};

export default SettingsPage;

