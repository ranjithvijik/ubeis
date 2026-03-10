// ============================================
// Alert Constants
// ============================================

import { AlertSeverity } from '../types';

export const ALERT_SEVERITIES: AlertSeverity[] = ['critical', 'warning', 'info'];

export const ALERT_TTL_HOURS: Record<AlertSeverity, number> = {
    critical: 168, // 7 days
    warning: 72,   // 3 days
    info: 24,      // 1 day
};

export const ALERT_MESSAGES = {
    BELOW_CRITICAL: (kpiName: string, value: number, threshold: number): string =>
        `${kpiName} has fallen below critical threshold: ${value} < ${threshold}`,
    BELOW_WARNING: (kpiName: string, value: number, threshold: number): string =>
        `${kpiName} is approaching critical threshold: ${value} < ${threshold}`,
    ABOVE_CRITICAL: (kpiName: string, value: number, threshold: number): string =>
        `${kpiName} has exceeded critical threshold: ${value} > ${threshold}`,
    ABOVE_WARNING: (kpiName: string, value: number, threshold: number): string =>
        `${kpiName} is approaching critical threshold: ${value} > ${threshold}`,
};

export const MAX_ACTIVE_ALERTS_PER_KPI = 5;
