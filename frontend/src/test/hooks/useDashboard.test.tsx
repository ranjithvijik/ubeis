import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboard } from '../../hooks/useDashboard';
import { dashboardService } from '../../services/dashboard.service';
import type { DashboardFilters } from '../../types';

vi.mock('../../services/dashboard.service');

const mockDashboardData = {
    summary: {
        totalKPIs: 10,
        kpisOnTarget: 7,
        kpisAtRisk: 2,
        kpisBelowTarget: 1,
        criticalAlerts: 1,
        warningAlerts: 2,
        infoAlerts: 3,
    },
    kpis: [],
    alerts: [],
    generatedAt: '2026-03-09T15:30:00Z',
};

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client= { queryClient } > { children } </QueryClientProvider>
  );
};

describe('useDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches dashboard data successfully', async () => {
        vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboardData);

        const { result } = renderHook(
            () => useDashboard({ period: 'monthly', category: 'all' }),
            { wrapper: createWrapper() }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockDashboardData);
        expect(dashboardService.getDashboard).toHaveBeenCalledWith({
            period: 'monthly',
            category: 'all',
        });
    });

    it('handles error state', async () => {
        vi.mocked(dashboardService.getDashboard).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(
            () => useDashboard({ period: 'monthly', category: 'all' }),
            { wrapper: createWrapper() }
        );

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeDefined();
    });

    it('refetches when filters change', async () => {
        vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboardData);

        const initialFilters: DashboardFilters = { period: 'monthly', category: 'all' };
        const updatedFilters: DashboardFilters = { period: 'weekly', category: 'enrollment' };

        const { result, rerender } = renderHook(
            ({ filters }) => useDashboard(filters),
            {
                wrapper: createWrapper(),
                initialProps: { filters: initialFilters },
            }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        rerender({ filters: updatedFilters });

        await waitFor(() => {
            expect(dashboardService.getDashboard).toHaveBeenCalledWith(updatedFilters);
        });
    });
});
