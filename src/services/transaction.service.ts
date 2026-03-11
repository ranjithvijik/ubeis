// ============================================
// Transaction Service (Drill-down)
// ============================================

import { TransactionRepository } from '../repositories/transaction.repository';
import { KPIRepository } from '../repositories/kpi.repository';
import { KPITransaction, PaginatedResponse, QueryOptions } from '../types';
import { Logger } from '../utils/logger.util';
import { NotFoundError } from '../middleware/error.middleware';

export class TransactionService {
    private transactionRepository: TransactionRepository;
    private kpiRepository: KPIRepository;
    private logger: Logger;

    constructor() {
        this.transactionRepository = new TransactionRepository();
        this.kpiRepository = new KPIRepository();
        this.logger = new Logger('TransactionService');
    }

    async getTransactionsForKPI(
        kpiId: string,
        options?: QueryOptions
    ): Promise<PaginatedResponse<KPITransaction>> {
        const kpi = await this.kpiRepository.getById(kpiId);
        if (!kpi) throw new NotFoundError('KPI', kpiId);

        const result = await this.transactionRepository.listByKPI(kpiId, options);
        this.logger.info('Fetched KPI transactions', { kpiId, count: result.items.length });

        return {
            items: result.items,
            nextToken: result.nextToken,
            count: result.items.length,
        };
    }
}

