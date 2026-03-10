import { Alert, AlertSeverity, AlertStatus } from '../../types';

export const createMockAlert = (overrides: Partial<Alert> = {}): Alert => ({
    alertId: 'alert-001',
    kpiId: 'kpi-001',
    kpiName: 'Test KPI',
    severity: 'warning',
    message: 'Test alert message',
    currentValue: 4200,
    threshold: 4500,
    status: 'active',
    createdAt: '2026-03-09T15:30:00Z',
    ...overrides,
});

export const mockAlerts: Alert[] = [
    createMockAlert({
        alertId: 'alert-001',
        kpiName: 'Enrollment Rate',
        severity: 'critical',
        message: 'Enrollment has fallen below critical threshold',
        status: 'active',
    }),
    createMockAlert({
        alertId: 'alert-002',
        kpiName: 'Budget Utilization',
        severity: 'warning',
        message: 'Budget utilization approaching limit',
        status: 'acknowledged',
        acknowledgedBy: 'admin@ubalt.edu',
        acknowledgedAt: '2026-03-09T16:00:00Z',
    }),
    createMockAlert({
        alertId: 'alert-003',
        kpiName: 'Course Completion',
        severity: 'info',
        message: 'Course completion rate has improved',
        status: 'resolved',
    }),
];
