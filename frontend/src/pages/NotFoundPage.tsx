import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        The page you are looking for could not be found.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
      >
        Go to dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;

