import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
import { Alert } from '../../types';
import clsx from 'clsx';

interface AlertListProps {
    alerts: Alert[];
    onAcknowledge?: (alertId: string) => void;
    onResolve?: (alertId: string) => void;
    isLoading?: boolean;
}

const severityConfig = {
    critical: {
        icon: AlertTriangle,
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-900/20',
        badge: 'bg-red-100 text-red-800',
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        badge: 'bg-yellow-100 text-yellow-800',
    },
    info: {
        icon: AlertTriangle,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        badge: 'bg-blue-100 text-blue-800',
    },
};

export const AlertList: React.FC<AlertListProps> = ({
    alerts,
    onAcknowledge,
    onResolve,
    isLoading = false,
}) => {
    if (isLoading) {
        return (
            <div className= "space-y-4" >
            {
                [1, 2, 3].map((i) => (
                    <div key= { i } className = "bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse" >
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
                ))
            }
            </div>
    );
  }

if (alerts.length === 0) {
    return (
        <div className= "text-center py-12 bg-white dark:bg-gray-800 rounded-xl" >
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white" >
                No Active Alerts
                    </h3>
                    < p className = "text-gray-500 dark:text-gray-400" >
                        All KPIs are performing within expected thresholds.
        </p>
                            </div>
    );
}

return (
    <div className= "space-y-4" >
    {
        alerts.map((alert, index) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;

            return (
                <motion.div
            key= { alert.alertId }
            initial = {{ opacity: 0, y: 20 }
        }
            animate = {{ opacity: 1, y: 0 }}
transition = {{ delay: index * 0.05 }}
className = {
    clsx(
              'bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4',
        alert.severity === 'critical' && 'border-red-500',
    alert.severity === 'warning' && 'border-yellow-500',
    alert.severity === 'info' && 'border-blue-500'
            )
}
    >
    <div className="flex items-start justify-between" >
        <div className="flex items-start gap-3" >
            <div className={ clsx('p-2 rounded-lg', config.bg) }>
                <Icon className={ clsx('w-5 h-5', config.color) } />
                    </div>
                    < div >
                    <div className="flex items-center gap-2 mb-1" >
                        <h4 className="font-semibold text-gray-900 dark:text-white" >
                            { alert.kpiName }
                            </h4>
                            < span className = { clsx('px-2 py-0.5 rounded-full text-xs font-medium', config.badge) } >
                                { alert.severity.toUpperCase() }
                                </span>
                                < span className = {
                                    clsx(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                                        alert.status === 'active' && 'bg-red-100 text-red-800',
                                    alert.status === 'acknowledged' && 'bg-yellow-100 text-yellow-800',
                                    alert.status === 'resolved' && 'bg-green-100 text-green-800'
                    )
                                } >
                                    { alert.status }
                                    </span>
                                    </div>
                                    < p className = "text-sm text-gray-600 dark:text-gray-300 mb-2" >
                                        { alert.message }
                                        </p>
                                        < div className = "flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400" >
                                            <span className="flex items-center gap-1" >
                                                <Clock className="w-3 h-3" />
                                                    { format(new Date(alert.createdAt), 'MMM d, yyyy h:mm a')}
</span>
{
    alert.acknowledgedBy && (
        <span className="flex items-center gap-1" >
            <User className="w-3 h-3" />
                Acknowledged by { alert.acknowledgedBy }
    </span>
                    )
}
</div>
    </div>
    </div>

{/* Actions */ }
<div className="flex items-center gap-2" >
{
    alert.status === 'active' && onAcknowledge && (
        <button
                    onClick={ () => onAcknowledge(alert.alertId) }
className = "px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
    >
    Acknowledge
    </button>
                )}
{
    alert.status === 'acknowledged' && onResolve && (
        <button
                    onClick={ () => onResolve(alert.alertId) }
    className = "px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
        >
        Resolve
        </button>
                )
}
</div>
    </div>
    </motion.div>
        );
      })}
</div>
  );
};
