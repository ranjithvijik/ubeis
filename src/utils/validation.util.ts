// ============================================
// Validation Utilities
// ============================================

import { z } from 'zod';
import { KPI_CATEGORIES } from '../constants/kpi.constants';
import { ALERT_SEVERITIES } from '../constants/alert.constants';

// KPI Schemas
export const createKPISchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    category: z.enum(KPI_CATEGORIES as [string, ...string[]]),
    targetValue: z.number(),
    unit: z.string().min(1).max(50),
    threshold: z.object({
        critical: z.number(),
        warning: z.number(),
    }),
    thresholdType: z.enum(['min', 'max']),
    dataSource: z.string().min(1).max(100),
});

export const updateKPISchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    currentValue: z.number().optional(),
    targetValue: z.number().optional(),
    threshold: z.object({
        critical: z.number(),
        warning: z.number(),
    }).optional(),
});

// Alert Schemas
export const createAlertSchema = z.object({
    kpiId: z.string().uuid(),
    kpiName: z.string().min(1),
    severity: z.enum(ALERT_SEVERITIES as [string, ...string[]]),
    message: z.string().min(1).max(500),
    currentValue: z.number(),
    threshold: z.number(),
});

export const acknowledgeAlertSchema = z.object({
    acknowledgedBy: z.string().min(1),
});

// Report Schemas
export const generateReportSchema = z.object({
    type: z.enum(['executive_summary', 'enrollment', 'financial', 'academic', 'custom']),
    title: z.string().min(1).max(200),
    description: z.string().max(500).optional(),
    format: z.enum(['pdf', 'excel', 'csv']),
    parameters: z.record(z.unknown()).optional(),
    dateRange: z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
    }).optional(),
});

// Query Parameter Schemas
export const paginationSchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    nextToken: z.string().optional(),
});

/** GET /kpis/:kpiId - includeHistory (default true), historyLimit (default 30, max 100) per API spec */
export const kpiDetailQuerySchema = z.object({
    includeHistory: z
        .string()
        .optional()
        .transform((v) => v !== 'false' && v !== '0'),
    historyLimit: z.coerce.number().min(1).max(100).default(30).optional(),
});

export const dashboardQuerySchema = z.object({
    period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
    category: z.enum([...KPI_CATEGORIES, 'all'] as [string, ...string[]]).default('all'),
});

// Validation Helper
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
    const result = schema.safeParse(data);

    if (!result.success) {
        const errors = result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));

        throw new ValidationError('Invalid request data', errors);
    }

    return result.data;
};

export class ValidationError extends Error {
    constructor(
        message: string,
        public details: Array<{ field: string; message: string }>
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}
