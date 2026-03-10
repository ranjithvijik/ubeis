// ============================================
// EIS Type Definitions
// ============================================

// --------------------------------------------
// KPI Types
// --------------------------------------------

export type KPICategory =
    | 'enrollment'
    | 'financial'
    | 'academic'
    | 'research'
    | 'operations';

export type KPIStatus = 'on_target' | 'at_risk' | 'below_target';

export type KPITrend = 'up' | 'down' | 'stable';

export type ThresholdType = 'min' | 'max';

export interface KPIThreshold {
    critical: number;
    warning: number;
}

export interface KPIHistoryPoint {
    date: string;
    value: number;
    recordedAt: string;
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
    thresholdType: ThresholdType;
    status: KPIStatus;
    trend: KPITrend;
    changePercent: number;
    history: KPIHistoryPoint[];
    dataSource: string;
    lastUpdated: string;
    updatedBy: string;
}

export interface CreateKPIRequest {
    name: string;
    description?: string;
    category: KPICategory;
    targetValue: number;
    unit: string;
    threshold: KPIThreshold;
    thresholdType: ThresholdType;
    dataSource: string;
}

export interface UpdateKPIRequest {
    name?: string;
    description?: string;
    currentValue?: number;
    targetValue?: number;
    threshold?: KPIThreshold;
}

// --------------------------------------------
// Alert Types
// --------------------------------------------

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
    resolvedAt?: string;
    createdAt: string;
    expiresAt?: string;
}

export interface CreateAlertRequest {
    kpiId: string;
    kpiName: string;
    severity: AlertSeverity;
    message: string;
    currentValue: number;
    threshold: number;
}

export interface AcknowledgeAlertRequest {
    acknowledgedBy: string;
}

// --------------------------------------------
// User Types
// --------------------------------------------

export type UserRole =
    | 'admin'
    | 'president'
    | 'provost'
    | 'cfo'
    | 'dean'
    | 'department_chair'
    | 'viewer';

export interface UserPreferences {
    dashboardLayout: string;
    alertChannels: ('email' | 'sms' | 'push')[];
    timezone: string;
    theme: 'light' | 'dark';
}

export interface User {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    department?: string;
    college?: string;
    preferences: UserPreferences;
    createdAt: string;
    lastLoginAt: string;
}

export interface UserContext {
    userId: string;
    email: string;
    role: UserRole;
    department?: string;
    college?: string;
}

// --------------------------------------------
// Dashboard Types
// --------------------------------------------

export interface DashboardSummary {
    totalKPIs: number;
    kpisOnTarget: number;
    kpisAtRisk: number;
    kpisBelowTarget: number;
    criticalAlerts: number;
    warningAlerts: number;
    infoAlerts: number;
}

export interface DashboardRequest {
    userId: string;
    role: UserRole;
    department?: string;
    college?: string;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    category?: KPICategory | 'all';
}

export interface DashboardResponse {
    summary: DashboardSummary;
    kpis: KPI[];
    alerts: Alert[];
    generatedAt: string;
}

// --------------------------------------------
// Report Types
// --------------------------------------------

export type ReportType = 'executive_summary' | 'enrollment' | 'financial' | 'academic' | 'custom';

export type ReportFormat = 'pdf' | 'excel' | 'csv';

export interface Report {
    reportId: string;
    userId: string;
    type: ReportType;
    title: string;
    description?: string;
    format: ReportFormat;
    parameters: Record<string, unknown>;
    s3Key: string;
    s3Bucket: string;
    fileSize: number;
    generatedAt: string;
    expiresAt: string;
}

export interface GenerateReportRequest {
    type: ReportType;
    title: string;
    description?: string;
    format: ReportFormat;
    parameters?: Record<string, unknown>;
    dateRange?: {
        start: string;
        end: string;
    };
}

// --------------------------------------------
// API Types
// --------------------------------------------

export interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: APIError;
    meta: APIMeta;
}

export interface APIError {
    code: string;
    message: string;
    details?: unknown;
}

export interface APIMeta {
    requestId: string;
    timestamp: string;
    version: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    nextToken?: string;
    count: number;
    totalCount?: number;
}

// --------------------------------------------
// DynamoDB Types
// --------------------------------------------

export interface DynamoDBItem {
    PK: string;
    SK: string;
    GSI1PK?: string;
    GSI1SK?: string;
    GSI2PK?: string;
    GSI2SK?: string;
    [key: string]: unknown;
}

export interface QueryOptions {
    limit?: number;
    nextToken?: string;
    sortOrder?: 'asc' | 'desc';
}
