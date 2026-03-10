import { apiService } from './api.service';
import { Alert, AlertSeverity, AlertStatus, PaginatedResponse } from '../types';

interface GetAlertsOptions {
    severity?: AlertSeverity;
    status?: AlertStatus;
    limit?: number;
}

class AlertService {
    async getAlerts(options: GetAlertsOptions = {}): Promise<PaginatedResponse<Alert>> {
        return apiService.get<PaginatedResponse<Alert>>('/alerts', options as Record<string, unknown>);
    }

    async getAlertById(alertId: string): Promise<Alert> {
        return apiService.get<Alert>(`/alerts/${alertId}`);
    }

    async acknowledgeAlert(alertId: string): Promise<Alert> {
        return apiService.post<Alert>(`/alerts/${alertId}/acknowledge`);
    }

    async resolveAlert(alertId: string): Promise<Alert> {
        return apiService.post<Alert>(`/alerts/${alertId}/resolve`);
    }
}

export const alertService = new AlertService();
