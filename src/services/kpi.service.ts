// ============================================
// KPI Service
// ============================================

import { KPIRepository } from '../repositories/kpi.repository';
import {
    KPI,
    KPICategory,
    CreateKPIRequest,
    UpdateKPIRequest,
    QueryOptions,
    PaginatedResponse,
} from '../types';
import { Logger } from '../utils/logger.util';
import { NotFoundError } from '../middleware/error.middleware';

export class KPIService {
    private kpiRepository: KPIRepository;
    private logger: Logger;

    constructor() {
        this.kpiRepository = new KPIRepository();
        this.logger = new Logger('KPIService');
    }

    async getKPIById(
        kpiId: string,
        options?: { includeHistory?: boolean; historyLimit?: number }
    ): Promise<KPI> {
        const kpi = await this.kpiRepository.getById(kpiId);

        if (!kpi) {
            throw new NotFoundError('KPI', kpiId);
        }

        const includeHistory = options?.includeHistory !== false;
        const historyLimit = Math.min(options?.historyLimit ?? 30, 100);

        if (includeHistory) {
            const historyResult = await this.kpiRepository.getHistory(kpiId, { limit: historyLimit });
            kpi.history = historyResult.items;
        } else {
            kpi.history = [];
        }

        return kpi;
    }

    async getKPIs(
        category?: KPICategory,
        options?: QueryOptions
    ): Promise<PaginatedResponse<KPI>> {
        let result;

        if (category) {
            result = await this.kpiRepository.getByCategory(category, options);
        } else {
            result = await this.kpiRepository.getAll(options);
        }

        return {
            items: result.items,
            nextToken: result.nextToken,
            count: result.items.length,
        };
    }

    async createKPI(request: CreateKPIRequest, userId: string): Promise<KPI> {
        this.logger.info('Creating KPI', { name: request.name, category: request.category });

        const kpi = await this.kpiRepository.create(request, userId);

        return kpi;
    }

    async updateKPI(
        kpiId: string,
        request: UpdateKPIRequest,
        userId: string
    ): Promise<KPI> {
        // Verify KPI exists
        const existing = await this.kpiRepository.getById(kpiId);
        if (!existing) {
            throw new NotFoundError('KPI', kpiId);
        }

        this.logger.info('Updating KPI', { kpiId });

        // If currentValue is being updated, use the special method
        if (request.currentValue !== undefined) {
            return this.kpiRepository.updateValue(kpiId, request.currentValue, userId);
        }

        return this.kpiRepository.update(kpiId, request, userId);
    }

    async deleteKPI(kpiId: string): Promise<void> {
        // Verify KPI exists
        const existing = await this.kpiRepository.getById(kpiId);
        if (!existing) {
            throw new NotFoundError('KPI', kpiId);
        }

        this.logger.info('Deleting KPI', { kpiId });

        await this.kpiRepository.delete(kpiId);
    }

    async getKPIHistory(
        kpiId: string,
        options?: QueryOptions
    ): Promise<PaginatedResponse<{ date: string; value: number }>> {
        // Verify KPI exists
        const existing = await this.kpiRepository.getById(kpiId);
        if (!existing) {
            throw new NotFoundError('KPI', kpiId);
        }

        const result = await this.kpiRepository.getHistory(kpiId, options);

        return {
            items: result.items.map((h) => ({ date: h.date, value: h.value })),
            nextToken: result.nextToken,
            count: result.items.length,
        };
    }
}
