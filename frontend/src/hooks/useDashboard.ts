import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { DashboardFilters, DashboardData } from '../types';

export const useDashboard = (filters: DashboardFilters) => {
    return useQuery<DashboardData>({
        queryKey: ['dashboard', filters],
        queryFn: () => dashboardService.getDashboard(filters),
        staleTime: 1000 * 60 * 2, // 2 minutes
        refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    });
};
