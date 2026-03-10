import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService } from '../services/alert.service';
import { Alert, AlertSeverity, AlertStatus, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

interface UseAlertsOptions {
    severity?: AlertSeverity;
    status?: AlertStatus;
    limit?: number;
}

export const useAlerts = (options: UseAlertsOptions = {}) => {
    return useQuery<PaginatedResponse<Alert>>({
        queryKey: ['alerts', options],
        queryFn: () => alertService.getAlerts(options),
        refetchInterval: 1000 * 30, // Refetch every 30 seconds
    });
};

export const useAcknowledgeAlert = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (alertId: string) => alertService.acknowledgeAlert(alertId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success('Alert acknowledged');
        },
        onError: (error: Error) => {
            toast.error(`Failed to acknowledge alert: ${error.message}`);
        },
    });
};

export const useResolveAlert = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (alertId: string) => alertService.resolveAlert(alertId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success('Alert resolved');
        },
        onError: (error: Error) => {
            toast.error(`Failed to resolve alert: ${error.message}`);
        },
    });
};
