import React from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Bell,
} from 'lucide-react';
import { DashboardSummary as DashboardSummaryType } from '../../types';
import { SummaryCard } from './SummaryCard';

interface DashboardSummaryProps {
    summary: DashboardSummaryType;
    isLoading?: boolean;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
    summary,
    isLoading = false,
}) => {
    const cards: Array<{
        title: string;
        value: number;
        icon: typeof TrendingUp;
        color: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
        description: string;
        percentage?: number;
      }> = [
        {
            title: 'Total KPIs',
            value: summary.totalKPIs,
            icon: TrendingUp,
            color: 'blue',
            description: 'Active metrics being tracked',
        },
        {
            title: 'On Target',
            value: summary.kpisOnTarget,
            icon: CheckCircle,
            color: 'green',
            description: 'KPIs meeting targets',
            percentage: summary.totalKPIs > 0
                ? Math.round((summary.kpisOnTarget / summary.totalKPIs) * 100)
                : 0,
        },
        {
            title: 'At Risk',
            value: summary.kpisAtRisk,
            icon: AlertTriangle,
            color: 'yellow',
            description: 'KPIs approaching thresholds',
            percentage: summary.totalKPIs > 0
                ? Math.round((summary.kpisAtRisk / summary.totalKPIs) * 100)
                : 0,
        },
        {
            title: 'Below Target',
            value: summary.kpisBelowTarget,
            icon: XCircle,
            color: 'red',
            description: 'KPIs below critical threshold',
            percentage: summary.totalKPIs > 0
                ? Math.round((summary.kpisBelowTarget / summary.totalKPIs) * 100)
                : 0,
        },
        {
            title: 'Critical Alerts',
            value: summary.criticalAlerts,
            icon: Bell,
            color: 'red',
            description: 'Require immediate attention',
        },
        {
            title: 'Warning Alerts',
            value: summary.warningAlerts,
            icon: Bell,
            color: 'yellow',
            description: 'Need review soon',
        },
    ];

    return (
        <div className= "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" >
        {
            cards.map((card, index) => (
                <motion.div
          key= { card.title }
          initial = {{ opacity: 0, y: 20 }}
    animate = {{ opacity: 1, y: 0 }
}
transition = {{ delay: index * 0.1 }}
        >
    <SummaryCard
            title={ card.title }
value = { card.value }
icon = { card.icon }
color = { card.color }
description = { card.description }
percentage = { card.percentage }
isLoading = { isLoading }
    />
    </motion.div>
      ))}
</div>
  );
};
