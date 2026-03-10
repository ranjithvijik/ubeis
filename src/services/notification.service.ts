// ============================================
// Notification Service
// ============================================

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Alert } from '../types';
import { Logger } from '../utils/logger.util';

export class NotificationService {
    private snsClient: SNSClient;
    private logger: Logger;
    private topicArn: string;

    constructor() {
        this.snsClient = new SNSClient({
            region: process.env.AWS_REGION || 'us-east-1',
        });
        this.logger = new Logger('NotificationService');
        this.topicArn = process.env.SNS_ALERTS_TOPIC || '';
    }

    async sendAlertNotification(alert: Alert): Promise<void> {
        if (!this.topicArn) {
            this.logger.warn('SNS topic ARN not configured, skipping notification');
            return;
        }

        const subject = this.formatSubject(alert);
        const message = this.formatMessage(alert);

        try {
            await this.snsClient.send(
                new PublishCommand({
                    TopicArn: this.topicArn,
                    Subject: subject,
                    Message: message,
                    MessageAttributes: {
                        severity: {
                            DataType: 'String',
                            StringValue: alert.severity,
                        },
                        kpiId: {
                            DataType: 'String',
                            StringValue: alert.kpiId,
                        },
                    },
                })
            );

            this.logger.info('Alert notification sent', {
                alertId: alert.alertId,
                severity: alert.severity,
            });
        } catch (error) {
            this.logger.error('Failed to send alert notification', {
                alertId: alert.alertId,
                error: (error as Error).message,
            });
            // Don't throw - notification failure shouldn't break the flow
        }
    }

    private formatSubject(alert: Alert): string {
        const severityEmoji = {
            critical: '🚨',
            warning: '⚠️',
            info: 'ℹ️',
        };

        return `${severityEmoji[alert.severity]} [${alert.severity.toUpperCase()}] ${alert.kpiName}`;
    }

    private formatMessage(alert: Alert): string {
        return `
EIS Alert Notification
======================
 
KPI: ${alert.kpiName}
Severity: ${alert.severity.toUpperCase()}
Status: ${alert.status}
 
Message: ${alert.message}
 
Current Value: ${alert.currentValue}
Threshold: ${alert.threshold}
 
Alert ID: ${alert.alertId}
Created: ${alert.createdAt}
 
---
University of Baltimore Executive Information System
    `.trim();
    }
}

8. LAMBDA HANDLERS
