// ============================================
// KPI Repository
// ============================================

import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base.repository';
import {
    KPI,
    KPICategory,
    CreateKPIRequest,
    UpdateKPIRequest,
    QueryOptions,
    KPIHistoryPoint,
} from '../types';
import {
    buildKPIKey,
    buildKPIHistoryKey,
    buildCategoryGSI,
} from '../utils/dynamodb.util';
import { formatISO, formatDate } from '../utils/date.util';

export class KPIRepository extends BaseRepository<KPI> {
    constructor() {
        super('KPIRepository');
    }

    async getById(kpiId: string): Promise<KPI | null> {
        const { PK, SK } = buildKPIKey(kpiId);
        const item = await this.getItem(PK, SK);

        if (!item) return null;

        return this.mapToKPI(item);
    }

    async getByCategory(
        category: KPICategory,
        options?: QueryOptions
    ): Promise<{ items: KPI[]; nextToken?: string }> {
        const result = await this.query(
            {
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :pk',
                ExpressionAttributeValues: {
                    ':pk': `CATEGORY#${category}`,
                },
            },
            options
        );

        return {
            items: result.items.map(this.mapToKPI),
            nextToken: result.nextToken,
        };
    }

    async getAll(options?: QueryOptions): Promise<{ items: KPI[]; nextToken?: string }> {
        const categories: KPICategory[] = [
            'enrollment',
            'financial',
            'academic',
            'research',
            'operations',
        ];

        const allKPIs: KPI[] = [];

        // FIX: Use a do-while loop to exhaust the nextToken for each category
        for (const category of categories) {
            let paginationToken: string | undefined = undefined;
            do {
                const result = await this.getByCategory(category, {
                    limit: 100,
                    nextToken: paginationToken,
                });
                allKPIs.push(...result.items);
                paginationToken = result.nextToken;
            } while (paginationToken);
        }

        // Apply manual pagination on the aggregated result
        const limit = options?.limit || 20;
        const startIndex = options?.nextToken ? parseInt(options.nextToken, 10) : 0;
        const endIndex = startIndex + limit;

        return {
            items: allKPIs.slice(startIndex, endIndex),
            nextToken: endIndex < allKPIs.length ? endIndex.toString() : undefined,
        };
    }

    async create(request: CreateKPIRequest, userId: string): Promise<KPI> {
        const kpiId = uuidv4();
        const now = formatISO();

        const kpi: KPI = {
            kpiId,
            name: request.name,
            description: request.description,
            category: request.category,
            currentValue: 0,
            previousValue: 0,
            targetValue: request.targetValue,
            unit: request.unit,
            threshold: request.threshold,
            thresholdType: request.thresholdType,
            status: 'on_target',
            trend: 'stable',
            changePercent: 0,
            history: [],
            dataSource: request.dataSource,
            lastUpdated: now,
            updatedBy: userId,
        };

        const { PK, SK } = buildKPIKey(kpiId);
        const gsiKeys = buildCategoryGSI(request.category, kpiId);

        await this.putItem({
            PK,
            SK,
            ...gsiKeys,
            ...kpi,
        });

        this.logger.info('KPI created', { kpiId, category: request.category });

        return kpi;
    }

    async update(kpiId: string, request: UpdateKPIRequest, userId: string): Promise<KPI> {
        const { PK, SK } = buildKPIKey(kpiId);

        const updates: Record<string, unknown> = {
            ...request,
            lastUpdated: formatISO(),
            updatedBy: userId,
        };

        const updated = await this.updateItem(PK, SK, updates);

        this.logger.info('KPI updated', { kpiId });

        return this.mapToKPI(updated);
    }

    async updateValue(
        kpiId: string,
        newValue: number,
        userId: string
    ): Promise<KPI> {
        const existing = await this.getById(kpiId);

        if (!existing) {
            throw new Error(`KPI ${kpiId} not found`);
        }

        const previousValue = existing.currentValue;
        // FIX: Zero-to-positive jump (e.g. new metric): treat as 100% growth instead of 0%
        const changePercent =
            previousValue !== 0
                ? ((newValue - previousValue) / previousValue) * 100
                : newValue > 0
                  ? 100
                  : 0;

        const trend = this.calculateTrend(changePercent);
        const status = this.calculateStatus(newValue, existing.threshold, existing.thresholdType);

        const { PK, SK } = buildKPIKey(kpiId);

        const updates = {
            currentValue: newValue,
            previousValue,
            changePercent: Math.round(changePercent * 100) / 100,
            trend,
            status,
            lastUpdated: formatISO(),
            updatedBy: userId,
        };

        const updated = await this.updateItem(PK, SK, updates);

        // Record history
        await this.recordHistory(kpiId, newValue);

        this.logger.info('KPI value updated', { kpiId, newValue, status });

        return this.mapToKPI(updated);
    }

    async delete(kpiId: string): Promise<void> {
        const { PK, SK } = buildKPIKey(kpiId);
        await this.deleteItem(PK, SK);

        this.logger.info('KPI deleted', { kpiId });
    }

    async getHistory(
        kpiId: string,
        options?: QueryOptions
    ): Promise<{ items: KPIHistoryPoint[]; nextToken?: string }> {
        const result = await this.query(
            {
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: {
                    ':pk': `KPI#${kpiId}`,
                    ':sk': 'HISTORY#',
                },
            },
            { ...options, sortOrder: 'desc' }
        );

        return {
            items: result.items.map((item: Record<string, unknown>) => ({
                date: item.date as string,
                value: item.value as number,
                recordedAt: item.recordedAt as string,
            })),
            nextToken: result.nextToken,
        };
    }

    private async recordHistory(kpiId: string, value: number): Promise<void> {
        const date = formatDate();
        const { PK, SK } = buildKPIHistoryKey(kpiId, date);

        await this.putItem({
            PK,
            SK,
            GSI2PK: `HISTORY#${date}`,
            GSI2SK: `KPI#${kpiId}`,
            kpiId,
            date,
            value,
            recordedAt: formatISO(),
        });
    }

    private calculateTrend(changePercent: number): 'up' | 'down' | 'stable' {
        if (changePercent > 1) return 'up';
        if (changePercent < -1) return 'down';
        return 'stable';
    }

    private calculateStatus(
        value: number,
        threshold: { critical: number; warning: number },
        thresholdType: 'min' | 'max'
    ): 'on_target' | 'at_risk' | 'below_target' {
        if (thresholdType === 'min') {
            if (value < threshold.critical) return 'below_target';
            if (value < threshold.warning) return 'at_risk';
            return 'on_target';
        } else {
            if (value > threshold.critical) return 'below_target';
            if (value > threshold.warning) return 'at_risk';
            return 'on_target';
        }
    }

    private mapToKPI(item: Record<string, unknown>): KPI {
        return {
            kpiId: item.kpiId as string,
            name: item.name as string,
            description: item.description as string | undefined,
            category: item.category as KPICategory,
            currentValue: item.currentValue as number,
            previousValue: item.previousValue as number,
            targetValue: item.targetValue as number,
            unit: item.unit as string,
            threshold: item.threshold as { critical: number; warning: number },
            thresholdType: item.thresholdType as 'min' | 'max',
            status: item.status as 'on_target' | 'at_risk' | 'below_target',
            trend: item.trend as 'up' | 'down' | 'stable',
            changePercent: item.changePercent as number,
            history: (item.history as KPIHistoryPoint[]) || [],
            dataSource: item.dataSource as string,
            lastUpdated: item.lastUpdated as string,
            updatedBy: item.updatedBy as string,
        };
    }
}
