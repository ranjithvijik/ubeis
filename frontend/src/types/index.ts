// ============================================
// Frontend Type Definitions
// ============================================

// KPI Types
export type KPICategory =
    | 'enrollment'
    | 'financial'
    | 'academic'
    | 'research'
    | 'operations';

export type KPIStatus = 'on_target' | 'at_risk' | 'below_target';
export type KPITrend = 'up' | 'down' | 'stable';

export interface KPIThreshold {
    critical: number;
    warning: number;
}

export interface KPIHistoryPoint {
    date: string;
    value: number;
}

export interface KPI {
    kpiId: string;
    name: string;
    description?: string;
    category: KPICategory;
    currentValue: number;
    previousValue: number;
    targetValue: number;
    unit: string;
    threshold: KPIThreshold;
    thresholdType: 'min' | 'max';
    status: KPIStatus;
    trend: KPITrend;
    changePercent: number;
    history: KPIHistoryPoint[];
    lastUpdated: string;
}

// Alert Types
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
    alertId: string;
    kpiId: string;
    kpiName: string;
    severity: AlertSeverity;
    message: string;
    currentValue: number;
    threshold: number;
    status: AlertStatus;
    acknowledgedBy?: string;
    acknowledgedAt?: string;
    createdAt: string;
}

// Dashboard Types
export interface DashboardSummary {
    totalKPIs: number;
    kpisOnTarget: number;
    kpisAtRisk: number;
    kpisBelowTarget: number;
    criticalAlerts: number;
    warningAlerts: number;
    infoAlerts: number;
}

export interface DashboardData {
    summary: DashboardSummary;
    kpis: KPI[];
    alerts: Alert[];
    generatedAt: string;
}

// User Types
export type UserRole =
    | 'admin'
    | 'president'
    | 'provost'
    | 'cfo'
    | 'dean'
    | 'department_chair'
    | 'viewer';

export interface User {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    department?: string;
    college?: string;
}

// API Types
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta: {
        requestId: string;
        timestamp: string;
    };
}

export interface PaginatedResponse<T> {
    items: T[];
    nextToken?: string;
    count: number;
}

// Filter Types
export interface DashboardFilters {
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    category: KPICategory | 'all';
}

export interface AlertFilters {
    severity?: AlertSeverity;
    status?: AlertStatus;
}
