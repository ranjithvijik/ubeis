import React from 'react';
import { DashboardSummary } from '../components/dashboard/DashboardSummary';
import { KPICard } from '../components/dashboard/KPICard';
import { DashboardVisualGallery } from '../components/dashboard/DashboardVisualGallery';
import { useDashboard } from '../hooks/useDashboard';
import { useNavigate } from 'react-router-dom';
import type { KPI } from '../types';
import { motion } from 'framer-motion';

const DashboardPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useDashboard({ period: 'monthly', category: 'all' });
  const navigate = useNavigate();

  const metricsById: Record<
    string,
    {
      rankInCategory: number;
      categorySize: number;
      contributionPercent?: number;
    }
  > = React.useMemo(() => {
    if (!data) return {};

    const byCategory: Record<string, KPI[]> = {};
    data.kpis.forEach((kpi) => {
      if (!byCategory[kpi.category]) byCategory[kpi.category] = [];
      byCategory[kpi.category].push(kpi);
    });

    const result: Record<string, { rankInCategory: number; categorySize: number; contributionPercent?: number }> = {};

    Object.entries(byCategory).forEach(([category, list]) => {
      const sorted = [...list].sort((a, b) => b.currentValue - a.currentValue);
      const total = sorted.reduce((sum, k) => sum + k.currentValue, 0);
      sorted.forEach((kpi, idx) => {
        const metrics: { rankInCategory: number; categorySize: number; contributionPercent?: number } = {
          rankInCategory: idx + 1,
          categorySize: sorted.length,
        };
        if ((category === 'enrollment' || category === 'financial') && total > 0) {
          metrics.contributionPercent = Number(((kpi.currentValue / total) * 100).toFixed(1));
        }
        result[kpi.kpiId] = metrics;
      });
    });

    return result;
  }, [data]);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500 dark:text-gray-400">Loading dashboard…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
        <p className="font-medium">Could not load dashboard</p>
        <p className="text-sm mt-1">{error?.message ?? 'Please ensure you are logged in and try again.'}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 text-sm font-medium underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {data && (
        <>
          <DashboardSummary summary={data.summary} isLoading={isLoading} />
          <DashboardVisualGallery kpis={data.kpis} summary={data.summary} />
        </>
      )}

      <section className="mt-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Key Performance Indicators
        </h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.06,
                delayChildren: 0.05,
              },
            },
          }}
        >
          {data?.kpis?.map((kpi) => (
            <motion.div
              key={kpi.kpiId}
              variants={{
                hidden: { opacity: 0, y: 10, scale: 0.98 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            >
              <KPICard
                kpi={kpi}
                metrics={metricsById[kpi.kpiId]}
                onClick={() => navigate(`/kpis/${kpi.kpiId}`)}
              />
            </motion.div>
          ))}
        </motion.div>
        {data && !isLoading && data.kpis.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No KPIs to display. Seed sample data or add KPIs.</p>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;

