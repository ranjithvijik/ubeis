// ============================================
// Alert Repository
// ============================================

import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base.repository';
import {
    Alert,
    AlertSeverity,
    AlertStatus,
    CreateAlertRequest,
    QueryOptions,
} from '../types';
import { buildAlertKey, buildActiveAlertGSI } from '../utils/dynamodb.util';
import { formatISO, addHours, getUnixTimestamp } from '../utils/date.util';
import { ALERT_TTL_HOURS } from '../constants/alert.constants';

export class AlertRepository extends BaseRepository<Alert> {
    constructor() {
        super('AlertRepository');
    }

    async getById(alertId: string): Promise<Alert | null> {
        const { PK, SK } = buildAlertKey(alertId);
        const item = await this.getItem(PK, SK);

        if (!item) return null;

        return this.mapToAlert(item as unknown as Record<string, unknown>);
    }

    async getActiveAlerts(
        severity?: AlertSeverity,
        options?: QueryOptions
    ): Promise<{ items: Alert[]; nextToken?: string }> {
        let keyCondition = 'GSI1PK = :pk';
        const expressionValues: Record<string, unknown> = {
            ':pk': 'ALERT#ACTIVE',
            ':active': 'active',
        };

        if (severity) {
            keyCondition += ' AND begins_with(GSI1SK, :severity)';
            expressionValues[':severity'] = severity;
        }

        const result = await this.query(
            {
                IndexName: 'GSI1',
                KeyConditionExpression: keyCondition,
                ExpressionAttributeValues: expressionValues,
                FilterExpression: '#status = :active',
                ExpressionAttributeNames: {
                    '#status': 'status',
                },
            },
            { ...options, sortOrder: 'desc' }
        );

        return {
            items: (result.items as unknown as Record<string, unknown>[]).map((i) => this.mapToAlert(i)),
            nextToken: result.nextToken,
        };
    }

    async getAlertsByKPI(
        kpiId: string,
        options?: QueryOptions
    ): Promise<{ items: Alert[]; nextToken?: string }> {
        const result = await this.query(
            {
                IndexName: 'GSI2',
                KeyConditionExpression: 'GSI2PK = :pk',
                ExpressionAttributeValues: {
                    ':pk': `KPI#${kpiId}`,
                },
            },
            options
        );

        return {
            items: (result.items as unknown as Record<string, unknown>[]).map((i) => this.mapToAlert(i)),
            nextToken: result.nextToken,
        };
    }

    async create(request: CreateAlertRequest): Promise<Alert> {
        const alertId = uuidv4();
        const now = formatISO();
        const ttlHours = ALERT_TTL_HOURS[request.severity];
        const expiresAt = addHours(new Date(), ttlHours);

        const alert: Alert = {
            alertId,
            kpiId: request.kpiId,
            kpiName: request.kpiName,
            severity: request.severity,
            message: request.message,
            currentValue: request.currentValue,
            threshold: request.threshold,
            status: 'active',
            createdAt: now,
            expiresAt: formatISO(expiresAt),
        };

        const { PK, SK } = buildAlertKey(alertId);
        const gsiKeys = buildActiveAlertGSI(request.severity, now);

        await this.putItem({
            PK,
            SK,
            ...gsiKeys,
            GSI2PK: `KPI#${request.kpiId}`,
            GSI2SK: `ALERT#${alertId}`,
            ...alert,
            TTL: getUnixTimestamp(expiresAt),
        });

        this.logger.info('Alert created', { alertId, severity: request.severity });

        return alert;
    }

    async acknowledge(alertId: string, userId: string): Promise<Alert> {
        const { PK, SK } = buildAlertKey(alertId);
        const now = formatISO();

        const updates = {
            status: 'acknowledged' as AlertStatus,
            acknowledgedBy: userId,
            acknowledgedAt: now,
        };

        const updated = await this.updateItem(PK, SK, updates);

        this.logger.info('Alert acknowledged', { alertId, userId });

        return this.mapToAlert(updated as unknown as Record<string, unknown>);
    }

    async resolve(alertId: string): Promise<Alert> {
        const { PK, SK } = buildAlertKey(alertId);
        const now = formatISO();

        const updates = {
            status: 'resolved' as AlertStatus,
            resolvedAt: now,
            // Remove from active index
            GSI1PK: `ALERT#RESOLVED`,
        };

        const updated = await this.updateItem(PK, SK, updates);

        this.logger.info('Alert resolved', { alertId });

        return this.mapToAlert(updated as unknown as Record<string, unknown>);
    }

    async delete(alertId: string): Promise<void> {
        const { PK, SK } = buildAlertKey(alertId);
        await this.deleteItem(PK, SK);

        this.logger.info('Alert deleted', { alertId });
    }

    private mapToAlert(item: Record<string, unknown>): Alert {
        return {
            alertId: item.alertId as string,
            kpiId: item.kpiId as string,
            kpiName: item.kpiName as string,
            severity: item.severity as AlertSeverity,
            message: item.message as string,
            currentValue: item.currentValue as number,
            threshold: item.threshold as number,
            status: item.status as AlertStatus,
            acknowledgedBy: item.acknowledgedBy as string | undefined,
            acknowledgedAt: item.acknowledgedAt as string | undefined,
            resolvedAt: item.resolvedAt as string | undefined,
            createdAt: item.createdAt as string,
            expiresAt: item.expiresAt as string | undefined,
        };
    }
}
