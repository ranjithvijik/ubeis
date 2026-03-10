// ============================================
// KPI Constants
// ============================================

import { KPICategory, KPIThreshold } from '../types';

export const KPI_CATEGORIES: KPICategory[] = [
    'enrollment',
    'financial',
    'academic',
    'research',
    'operations',
];

export const DEFAULT_THRESHOLDS: Record<string, KPIThreshold> = {
    enrollment_rate: { critical: 0.5, warning: 0.65 },
    retention_rate: { critical: 0.7, warning: 0.75 },
    graduation_rate: { critical: 0.35, warning: 0.4 },
    budget_utilization: { critical: 1.05, warning: 0.95 },
    cost_per_student: { critical: 25000, warning: 22000 },
    course_completion: { critical: 0.8, warning: 0.85 },
    average_gpa: { critical: 2.5, warning: 2.7 },
    faculty_ratio: { critical: 25, warning: 20 },
};

export const KPI_UNITS: Record<string, string> = {
    enrollment: 'students',
    retention_rate: 'percent',
    graduation_rate: 'percent',
    tuition_revenue: 'dollars',
    budget_utilization: 'percent',
    cost_per_student: 'dollars',
    course_completion: 'percent',
    average_gpa: 'points',
    faculty_ratio: 'ratio',
};

export const HISTORY_RETENTION_DAYS = 365;
export const MAX_HISTORY_POINTS = 100;
