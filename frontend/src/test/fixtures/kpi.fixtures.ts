import { KPI } from '../../types';

export const createMockKPI = (overrides: Partial<KPI> = {}): KPI => ({
    kpiId: 'kpi-001',
    name: 'Test KPI',
    description: 'A test KPI',
    category: 'enrollment',
    currentValue: 5000,
    previousValue: 4800,
    targetValue: 5500,
    unit: 'students',
    threshold: { critical: 4000, warning: 4500 },
    thresholdType: 'min',
    status: 'on_target',
    trend: 'up',
    changePercent: 4.17,
    history: [
        { date: '2026-03-01', value: 4800 },
        { date: '2026-03-02', value: 4900 },
        { date: '2026-03-03', value: 5000 },
    ],
    lastUpdated: '2026-03-09T15:30:00Z',
    ...overrides,
});

export const mockKPIs: KPI[] = [
    createMockKPI({ kpiId: 'kpi-001', name: 'Total Enrollment', category: 'enrollment' }),
    createMockKPI({ kpiId: 'kpi-002', name: 'Retention Rate', category: 'enrollment', unit: 'percent', currentValue: 0.82 }),
    createMockKPI({ kpiId: 'kpi-003', name: 'Tuition Revenue', category: 'financial', unit: 'dollars', currentValue: 42500000 }),
    createMockKPI({ kpiId: 'kpi-004', name: 'Graduation Rate', category: 'academic', unit: 'percent', currentValue: 0.45, status: 'at_risk' }),
    createMockKPI({ kpiId: 'kpi-005', name: 'Research Grants', category: 'research', unit: 'dollars', currentValue: 5200000 }),
];
