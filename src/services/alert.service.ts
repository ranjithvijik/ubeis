// ============================================
// Alert Service
// ============================================

import { AlertRepository } from '../repositories/alert.repository';
import { NotificationService } from './notification.service';
import {
    Alert,
    AlertSeverity,
    CreateAlertRequest,
    QueryOptions,
    PaginatedResponse,
} from '../types';
import { Logger } from '../utils/logger.util';
import { NotFoundError } from '../middleware/error.middleware';

export class AlertService {
    private alertRepository: AlertRepository;
    private notificationService: NotificationService;
    private logger: Logger;

    constructor() {
        this.alertRepository = new AlertRepository();
        this.notificationService = new NotificationService();
        this.logger = new Logger('AlertService');
    }

    async getAlertById(alertId: string): Promise<Alert> {
        const alert = await this.alertRepository.getById(alertId);

        if (!alert) {
            throw new NotFoundError('Alert', alertId);
        }

        return alert;
    }

    async getActiveAlerts(
        severity?: AlertSeverity,
        options?: QueryOptions
    ): Promise<PaginatedResponse<Alert>> {
        const result = await this.alertRepository.getActiveAlerts(severity, options);

        return {
            items: result.items,
            nextToken: result.nextToken,
            count: result.items.length,
        };
    }

    async getAlertsByKPI(
        kpiId: string,
        options?: QueryOptions
    ): Promise<PaginatedResponse<Alert>> {
        const result = await this.alertRepository.getAlertsByKPI(kpiId, options);

        return {
            items: result.items,
            nextToken: result.nextToken,
            count: result.items.length,
        };
    }

    async createAlert(request: CreateAlertRequest): Promise<Alert> {
        this.logger.info('Creating alert', {
            kpiId: request.kpiId,
            severity: request.severity,
        });

        const alert = await this.alertRepository.create(request);

        // Send notification for critical and warning alerts
        if (request.severity !== 'info') {
            await this.notificationService.sendAlertNotification(alert);
        }

        return alert;
    }

    async acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
        // Verify alert exists
        const existing = await this.alertRepository.getById(alertId);
        if (!existing) {
            throw new NotFoundError('Alert', alertId);
        }

        if (existing.status !== 'active') {
            this.logger.warn('Attempting to acknowledge non-active alert', {
                alertId,
                currentStatus: existing.status,
            });
        }

        this.logger.info('Acknowledging alert', { alertId, userId });

        return this.alertRepository.acknowledge(alertId, userId);
    }

    async resolveAlert(alertId: string): Promise<Alert> {
        // Verify alert exists
        const existing = await this.alertRepository.getById(alertId);
        if (!existing) {
            throw new NotFoundError('Alert', alertId);
        }

        this.logger.info('Resolving alert', { alertId });

        return this.alertRepository.resolve(alertId);
    }

    async deleteAlert(alertId: string): Promise<void> {
        // Verify alert exists
        const existing = await this.alertRepository.getById(alertId);
        if (!existing) {
            throw new NotFoundError('Alert', alertId);
        }

        this.logger.info('Deleting alert', { alertId });

        await this.alertRepository.delete(alertId);
    }
}
