import { apiService } from './api.service';
import type {
    Report,
    ReportWithDownloadUrl,
    GenerateReportRequest,
    PaginatedResponse,
} from '../types';

class ReportService {
    async getReports(options?: { limit?: number; nextToken?: string }): Promise<PaginatedResponse<Report>> {
        return apiService.get<PaginatedResponse<Report>>('/reports', options as Record<string, unknown>);
    }

    async generateReport(request: GenerateReportRequest): Promise<ReportWithDownloadUrl> {
        return apiService.post<ReportWithDownloadUrl>('/reports', request);
    }

    async getDownloadUrl(reportId: string): Promise<{ downloadUrl: string }> {
        return apiService.get<{ downloadUrl: string }>(`/reports/${reportId}/download`);
    }
}

export const reportService = new ReportService();
