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
        ring: 'ring-green-500/15',
        accent: 'from-green-500/30 via-emerald-500/10 to-transparent',
        badge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
        progress: 'bg-green-500',
    },
    at_risk: {
        ring: 'ring-amber-500/15',
        accent: 'from-amber-500/30 via-yellow-500/10 to-transparent',
        badge: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
        progress: 'bg-amber-500',
    },
    below_target: {
        ring: 'ring-rose-500/15',
        accent: 'from-rose-500/30 via-red-500/10 to-transparent',
        badge: 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200',
        progress: 'bg-rose-500',
    },
};

const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
};

const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-rose-600 dark:text-rose-400',
    stable: 'text-gray-600 dark:text-gray-400',
};

const sparklinePath = (values: number[], width = 96, height = 28): string | null => {
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return [x, y] as const;
    });

    return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
};

export const KPICard: React.FC<KPICardProps> = ({ kpi, onClick }) => {
    const colors = statusColors[kpi.status];
    const TrendIcon = trendIcons[kpi.trend];
    const historyValues = (kpi.history || []).slice(-14).map((h) => h.value);
    const spark = sparklinePath(historyValues);

    const statusLabels = {
        on_target: 'On Target',
        at_risk: 'At Risk',
        below_target: 'Below Target',
    };

    return (
        <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={onClick}
            className={clsx(
                'relative overflow-hidden rounded-2xl border border-gray-200/70 dark:border-gray-700/70',
                'bg-white/80 dark:bg-gray-900/40 backdrop-blur',
                'shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer',
                'ring-1',
                colors.ring
            )}
        >
            {/* accent wash */}
            <div className={clsx('pointer-events-none absolute inset-0 bg-gradient-to-br', colors.accent)} />

            <div className="relative p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {kpi.name}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {kpi.category}
                            </span>
                            {spark && (
                                <svg width="96" height="28" viewBox="0 0 96 28" className="opacity-80">
                                    <path
                                        d={spark}
                                        fill="none"
                                        stroke="currentColor"
                                        className={clsx(
                                            'stroke-[2]',
                                            kpi.trend === 'up' && 'text-green-600/70 dark:text-green-400/70',
                                            kpi.trend === 'down' && 'text-rose-600/70 dark:text-rose-400/70',
                                            kpi.trend === 'stable' && 'text-gray-500/70 dark:text-gray-400/70'
                                        )}
                                    />
                                </svg>
                            )}
                        </div>
                    </div>

                    <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap', colors.badge)}>
                        {statusLabels[kpi.status]}
                    </span>
                </div>

                {/* Value + delta */}
                <div className="flex items-end justify-between gap-3 mb-4">
                    <div className="min-w-0">
                        <div className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {formatValue(kpi.currentValue, kpi.unit)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Target {formatValue(kpi.targetValue, kpi.unit)}
                        </div>
                    </div>
                    <div
                        className={clsx(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                            'bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/70',
                            trendColors[kpi.trend]
                        )}
                        title="Change vs previous period"
                    >
                        <TrendIcon className="w-4 h-4" />
                        <span>{formatPercent(kpi.changePercent)}</span>
                    </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                    <div className="h-2.5 bg-gray-200/80 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className={clsx('h-full rounded-full transition-all duration-500', colors.progress)}
                            style={{
                                width: `${Math.min((kpi.currentValue / kpi.targetValue) * 100, 100)}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Updated {new Date(kpi.lastUpdated).toLocaleDateString()}</span>
                    <Link
                        to={`/kpis/${kpi.kpiId}`}
                        className="flex items-center gap-1 font-medium text-primary-500 hover:text-primary-600"
                        onClick={(e) => e.stopPropagation()}
                    >
                        View details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};
