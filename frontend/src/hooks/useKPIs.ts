import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kpiService } from '../services/kpi.service';
import { KPI, KPICategory, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

interface UseKPIsOptions {
    category?: KPICategory;
    limit?: number;
}

export const useKPIs = (options: UseKPIsOptions = {}) => {
    return useQuery<PaginatedResponse<KPI>>({
        queryKey: ['kpis', options],
        queryFn: () => kpiService.getKPIs(options.category, options.limit),
    });
};

export const useKPI = (kpiId: string) => {
    return useQuery<KPI>({
        queryKey: ['kpi', kpiId],
        queryFn: () => kpiService.getKPIById(kpiId),
        enabled: !!kpiId,
    });
};

export const useUpdateKPI = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ kpiId, data }: { kpiId: string; data: Partial<KPI> }) =>
            kpiService.updateKPI(kpiId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['kpis'] });
            queryClient.invalidateQueries({ queryKey: ['kpi', variables.kpiId] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success('KPI updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update KPI: ${error.message}`);
        },
    });
};
