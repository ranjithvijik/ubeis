import React from 'react';
import { useParams } from 'react-router-dom';
import { useKPIDetail } from '../hooks/useKPIDetail';
import { KPICard } from '../components/dashboard/KPICard';
import { useKPITransactions } from '../hooks/useTransactions';
import { formatValue } from '../utils/formatters';

const KPIDetailPage: React.FC = () => {
  const { kpiId } = useParams<{ kpiId: string }>();
  const { data, isLoading } = useKPIDetail(kpiId!);
  const { data: txData, isLoading: txLoading, isError: txIsError, error: txError, refetch: refetchTx } = useKPITransactions(kpiId || '', { limit: 25 });

  if (!kpiId) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No KPI selected.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading KPI...</p>;
  }

  if (!data) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">KPI not found.</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white break-words">
        {data.name}
      </h1>
      <KPICard kpi={data} />

      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Transactions</h2>
          <button
            type="button"
            onClick={() => refetchTx()}
            className="self-start min-h-[44px] px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline touch-manipulation"
          >
            Refresh
          </button>
        </div>

        {txLoading && !txData && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading transactions…</p>
        )}

        {txIsError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
            <p className="font-medium">Could not load transactions</p>
            <p className="text-sm mt-1">{(txError as any)?.message ?? 'Please try again.'}</p>
          </div>
        )}

        {txData && txData.items.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No transactions found for this KPI.</p>
        )}

        {txData && txData.items.length > 0 && (
          <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 touch-pan-x">
            <table className="min-w-[600px] divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Occurred</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kind</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {txData.items.map((tx) => (
                  <tr key={tx.transactionId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {new Date(tx.occurredAt).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {tx.kind.replace(/_/g, ' ')}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {typeof tx.amount === 'number'
                        ? formatValue(tx.amount, 'dollars')
                        : typeof tx.value === 'number'
                          ? formatValue(tx.value, tx.unit || '')
                          : '—'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {tx.sourceSystem || '—'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 min-w-[120px]">
                      {tx.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default KPIDetailPage;

