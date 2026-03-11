import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../services/report.service';
import type { Report, GenerateReportRequest, ReportWithDownloadUrl, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

export const useReports = (options?: { limit?: number; nextToken?: string }) => {
    return useQuery<PaginatedResponse<Report>>({
        queryKey: ['reports', options],
        queryFn: () => reportService.getReports(options),
    });
};

export const useGenerateReport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: GenerateReportRequest) => reportService.generateReport(request),
        onSuccess: (data: ReportWithDownloadUrl) => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            toast.success(`Report "${data.title}" generated`);
            if (data.downloadUrl) {
                window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
            }
        },
        onError: (error: Error) => {
            toast.error(`Failed to generate report: ${error.message}`);
        },
    });
};
