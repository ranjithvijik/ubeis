// ============================================
// Alert Processor Lambda Handler (DynamoDB Streams)
// ============================================

import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AlertService } from '../services/alert.service';
import { Logger } from '../utils/logger.util';
import { KPI, CreateAlertRequest, AlertSeverity } from '../types';
import { ALERT_MESSAGES } from '../constants/alert.constants';

const alertService = new AlertService();
const logger = new Logger('AlertProcessor');

interface AlertCondition {
    severity: AlertSeverity;
    message: string;
}

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
    logger.info('Processing DynamoDB stream events', {
        recordCount: event.Records.length,
    });

    for (const record of event.Records) {
        try {
            await processRecord(record);
        } catch (error) {
            logger.error('Error processing record', {
                eventID: record.eventID,
                error: (error as Error).message,
            });
            // Continue processing other records
        }
    }
};

const processRecord = async (record: DynamoDBRecord): Promise<void> => {
    // Only process MODIFY and INSERT events
    if (record.eventName !== 'MODIFY' && record.eventName !== 'INSERT') {
        return;
    }

    const newImage = record.dynamodb?.NewImage;
    if (!newImage) {
        return;
    }

    // Unmarshall the DynamoDB item
    const item = unmarshall(newImage as Record<string, unknown>);

    // Check if this is a KPI record
    if (!item.PK?.startsWith('KPI#') || item.SK !== 'METADATA') {
        return;
    }

    const kpi = item as unknown as KPI;

    logger.debug('Processing KPI update', {
        kpiId: kpi.kpiId,
        currentValue: kpi.currentValue,
    });

    // Evaluate threshold conditions
    const alertCondition = evaluateThreshold(kpi);

    if (alertCondition) {
        // FIX: Check for existing active alerts for this specific KPI to prevent duplicates
        const existingAlerts = await alertService.getAlertsByKPI(kpi.kpiId);
        const hasActiveAlert = existingAlerts.items.some(
            (alert) => alert.status === 'active' && alert.severity === alertCondition.severity
        );

        if (!hasActiveAlert) {
            const alertRequest: CreateAlertRequest = {
                kpiId: kpi.kpiId,
                kpiName: kpi.name,
                severity: alertCondition.severity,
                message: alertCondition.message,
                currentValue: kpi.currentValue,
                threshold:
                    alertCondition.severity === 'critical'
                        ? kpi.threshold.critical
                        : kpi.threshold.warning,
            };

            await alertService.createAlert(alertRequest);

            logger.info('Alert created from KPI threshold breach', {
                kpiId: kpi.kpiId,
                severity: alertCondition.severity,
            });
        } else {
            logger.debug('Alert suppressed: Active alert already exists for KPI', {
                kpiId: kpi.kpiId,
            });
        }
    }
};

const evaluateThreshold = (kpi: KPI): AlertCondition | null => {
    const { currentValue, threshold, thresholdType, name } = kpi;

    if (thresholdType === 'min') {
        // Value should be above threshold (e.g., enrollment, retention)
        if (currentValue < threshold.critical) {
            return {
                severity: 'critical',
                message: ALERT_MESSAGES.BELOW_CRITICAL(name, currentValue, threshold.critical),
            };
        }

        if (currentValue < threshold.warning) {
            return {
                severity: 'warning',
                message: ALERT_MESSAGES.BELOW_WARNING(name, currentValue, threshold.warning),
            };
        }
    } else {
        // Value should be below threshold (e.g., cost per student, budget utilization) — max thresholds
        if (currentValue > threshold.critical) {
            return {
                severity: 'critical',
                message: ALERT_MESSAGES.ABOVE_CRITICAL(name, currentValue, threshold.critical),
            };
        }

        // FIX: Explicit warning band for max thresholds (above warning, at or below critical)
        if (
            thresholdType === 'max' &&
            currentValue > threshold.warning &&
            currentValue <= threshold.critical
        ) {
            return {
                severity: 'warning',
                message: ALERT_MESSAGES.ABOVE_WARNING(name, currentValue, threshold.warning),
            };
        }
        if (currentValue > threshold.warning) {
            return {
                severity: 'warning',
                message: ALERT_MESSAGES.ABOVE_WARNING(name, currentValue, threshold.warning),
            };
        }
    }

    return null;
};
