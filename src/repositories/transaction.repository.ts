// ============================================
// Transaction Repository (Drill-down)
// ============================================

import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base.repository';
import { KPITransaction, QueryOptions, TransactionKind } from '../types';
import { buildKPITransactionKey } from '../utils/dynamodb.util';
import { formatISO } from '../utils/date.util';

export class TransactionRepository extends BaseRepository<KPITransaction> {
    constructor() {
        super('TransactionRepository');
    }

    async listByKPI(
        kpiId: string,
        options?: QueryOptions
    ): Promise<{ items: KPITransaction[]; nextToken?: string }> {
        const result = await this.query(
            {
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: {
                    ':pk': `KPI#${kpiId}`,
                    ':sk': 'TX#',
                },
            },
            { ...options, sortOrder: 'desc' }
        );

        return {
            items: (result.items as unknown as Record<string, unknown>[]).map((i) => this.mapToTx(i)),
            nextToken: result.nextToken,
        };
    }

    async create(
        input: Omit<KPITransaction, 'transactionId' | 'occurredAt'> & { occurredAt?: string }
    ): Promise<KPITransaction> {
        const transactionId = uuidv4();
        const occurredAt = input.occurredAt ?? formatISO();
        const { PK, SK } = buildKPITransactionKey(input.kpiId, occurredAt, transactionId);

        const tx: KPITransaction = {
            transactionId,
            kpiId: input.kpiId,
            occurredAt,
            kind: input.kind,
            amount: input.amount,
            value: input.value,
            unit: input.unit,
            sourceSystem: input.sourceSystem,
            description: input.description,
            attributes: input.attributes,
        };

        await this.putItem({
            PK,
            SK,
            ...tx,
        });

        return tx;
    }

    private mapToTx(item: Record<string, unknown>): KPITransaction {
        return {
            transactionId: item.transactionId as string,
            kpiId: item.kpiId as string,
            occurredAt: item.occurredAt as string,
            kind: (item.kind as TransactionKind) ?? 'other',
            amount: item.amount as number | undefined,
            value: item.value as number | undefined,
            unit: item.unit as string | undefined,
            sourceSystem: item.sourceSystem as string | undefined,
            description: (item.description as string) ?? '',
            attributes: item.attributes as Record<string, unknown> | undefined,
        };
    }
}

