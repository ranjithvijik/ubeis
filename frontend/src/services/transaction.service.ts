import { apiService } from './api.service';
import type { KPITransaction, PaginatedResponse } from '../types';

class TransactionService {
    async getTransactionsForKPI(
        kpiId: string,
        options?: { limit?: number; nextToken?: string }
    ): Promise<PaginatedResponse<KPITransaction>> {
        return apiService.get<PaginatedResponse<KPITransaction>>(`/kpis/${kpiId}/transactions`, options as Record<string, unknown>);
    }
}

export const transactionService = new TransactionService();

