import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert } from '../../types';
import clsx from 'clsx';

interface AlertBannerProps {
    alerts: Alert[];
    onDismiss?: (alertId: string) => void;
    maxVisible?: number;
}

const severityStyles = {
    critical: {
        bg: 'bg-red-50 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-500',
        text: 'text-red-800 dark:text-red-200',
    },
    warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/30',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-500',
        text: 'text-yellow-800 dark:text-yellow-200',
    },
    info: {
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-500',
        text: 'text-blue-800 dark:text-blue-200',
    },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({
    alerts,
    onDismiss,
    maxVisible = 3,
}) => {
    const visibleAlerts = alerts.slice(0, maxVisible);
    const remainingCount = alerts.length - maxVisible;

    if (alerts.length === 0) {
        return null;
    }

    return (
        <div className= "space-y-2" >
        <AnimatePresence>
        {
            visibleAlerts.map((alert) => {
                const styles = severityStyles[alert.severity];

                return (
                    <motion.div
              key= { alert.alertId }
                initial = {{ opacity: 0, y: -10 }
            }
              animate = {{ opacity: 1, y: 0 }}
    exit = {{ opacity: 0, x: 100 }
}
className = {
    clsx(
                'flex items-center justify-between p-3 rounded-lg border',
        styles.bg,
    styles.border
              )
}
    >
    <div className="flex items-center gap-3" >
        <AlertTriangle className={ clsx('w-5 h-5', styles.icon) } />
            < div >
            <p className={ clsx('text-sm font-medium', styles.text) }>
                { alert.kpiName }
                </p>
                < p className = "text-xs text-gray-600 dark:text-gray-400" >
                    { alert.message }
                    </p>
                    </div>
                    </div>

                    < div className = "flex items-center gap-2" >
                        <Link
                  to={ `/alerts` }
className = "text-xs text-primary-500 hover:text-primary-600"
    >
    View
    </Link>
{
    onDismiss && (
        <button
                    onClick={ () => onDismiss(alert.alertId) }
    className = "p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
        <X className="w-4 h-4 text-gray-500" />
            </button>
                )
}
</div>
    </motion.div>
          );
        })}
</AnimatePresence>

{
    remainingCount > 0 && (
        <Link
          to="/alerts"
    className = "flex items-center justify-center gap-2 p-2 text-sm text-primary-500 hover:text-primary-600 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
        <Bell className="w-4 h-4" />
            View { remainingCount } more alert{ remainingCount > 1 ? 's' : '' }
    </Link>
      )
}
</div>
  );
};
