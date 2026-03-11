import { useQuery } from '@tanstack/react-query';
import { transactionService } from '../services/transaction.service';
import type { KPITransaction, PaginatedResponse } from '../types';

export const useKPITransactions = (
    kpiId: string,
    options?: { limit?: number; nextToken?: string }
) => {
    return useQuery<PaginatedResponse<KPITransaction>>({
        queryKey: ['kpi-transactions', kpiId, options],
        enabled: !!kpiId,
        queryFn: () => transactionService.getTransactionsForKPI(kpiId, options),
    });
};

