import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { KPI } from '../../types';
import { formatValue, formatPercent } from '../../utils/formatters';

interface KPICardProps {
    kpi: KPI;
    onClick?: () => void;
}

const statusColors = {
    on_target: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    at_risk: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    below_target: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
};

const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
};

const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    stable: 'text-gray-500',
};

export const KPICard: React.FC<KPICardProps> = ({ kpi, onClick }) => {
    const colors = statusColors[kpi.status];
    const TrendIcon = trendIcons[kpi.trend];

    const statusLabels = {
        on_target: 'On Target',
        at_risk: 'At Risk',
        below_target: 'Below Target',
    };

    return (
        <motion.div
      whileHover= {{ scale: 1.02 }
}
whileTap = {{ scale: 0.98 }}
className = {
    clsx(
        'bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border-l-4 cursor-pointer',
        'hover:shadow-md transition-all duration-200',
        colors.border
      )
}
onClick = { onClick }
    >
    {/* Header */ }
    < div className = "flex items-start justify-between mb-3" >
        <div>
        <h3 className="font-semibold text-gray-900 dark:text-white" >
            { kpi.name }
            </h3>
            < span className = "text-xs text-gray-500 dark:text-gray-400 capitalize" >
                { kpi.category }
                </span>
                </div>
                < span className = { clsx('px-2 py-1 rounded-full text-xs font-medium', colors.badge) } >
                    { statusLabels[kpi.status]}
                    </span>
                    </div>

{/* Value */ }
<div className="flex items-baseline gap-3 mb-3" >
    <span className="text-3xl font-bold text-gray-900 dark:text-white" >
        { formatValue(kpi.currentValue, kpi.unit) }
        </span>
        < div className = { clsx('flex items-center gap-1', trendColors[kpi.trend]) } >
            <TrendIcon className="w-4 h-4" />
                <span className="text-sm font-medium" >
                    { formatPercent(kpi.changePercent) }
                    </span>
                    </div>
                    </div>

{/* Progress bar */ }
<div className="mb-3" >
    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1" >
        <span>Progress to Target </span>
            < span > { formatValue(kpi.targetValue, kpi.unit) } </span>
            </div>
            < div className = "h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" >
                <div
            className={
    clsx(
        'h-full rounded-full transition-all duration-500',
        kpi.status === 'on_target' && 'bg-green-500',
        kpi.status === 'at_risk' && 'bg-yellow-500',
        kpi.status === 'below_target' && 'bg-red-500'
    )
}
style = {{
    width: `${Math.min((kpi.currentValue / kpi.targetValue) * 100, 100)}%`,
            }}
          />
    </div>
    </div>

{/* Footer */ }
<div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400" >
    <span>Updated { new Date(kpi.lastUpdated).toLocaleDateString() } </span>
        < Link
to = {`/kpis/${kpi.kpiId}`}
className = "flex items-center gap-1 text-primary-500 hover:text-primary-600"
onClick = {(e) => e.stopPropagation()}
        >
    View Details
        < ArrowRight className = "w-3 h-3" />
            </Link>
            </div>
            </motion.div>
  );
};
