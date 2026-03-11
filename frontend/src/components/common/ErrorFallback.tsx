import React from 'react';
import { FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export const ErrorFallback: React.FC<FallbackProps> = ({
    error,
    resetErrorBoundary,
}) => {
    return (
        <div className= "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4" >
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center" >
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4" >
                <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>

                    < h1 className = "text-2xl font-bold text-gray-900 dark:text-white mb-2" >
                        Something went wrong
                            </h1>

                            < p className = "text-gray-600 dark:text-gray-300 mb-4" >
                                We encountered an unexpected error.Please try again or contact support if the problem persists.
        </p>

    {
        process.env.NODE_ENV === 'development' && (
            <pre className="text-left text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-4 overflow-auto max-h-32" >
                { error.message }
                </pre>
        )}

<div className="flex gap-3 justify-center" >
            <button
            onClick={ resetErrorBoundary }
className = "flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
    >
    <RefreshCw className="w-4 h-4" />
        Try Again
            </button>
            < button
onClick = {() => { window.location.href = '/'; }}
className = "flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
    >
    <Home className="w-4 h-4" />
        Go Home
            </button>
            </div>
            </div>
            </div>
  );
};
