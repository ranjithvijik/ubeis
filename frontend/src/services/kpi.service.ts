import { apiService } from './api.service';
import { KPI, KPICategory, PaginatedResponse } from '../types';

class KPIService {
    async getKPIs(category?: KPICategory, limit?: number): Promise<PaginatedResponse<KPI>> {
        return apiService.get<PaginatedResponse<KPI>>('/kpis', { category, limit });
    }

    async getKPIById(kpiId: string): Promise<KPI> {
        return apiService.get<KPI>(`/kpis/${kpiId}`);
    }

    async updateKPI(kpiId: string, data: Partial<KPI>): Promise<KPI> {
        return apiService.put<KPI>(`/kpis/${kpiId}`, data);
    }

    async getKPIHistory(kpiId: string, limit?: number): Promise<{ date: string; value: number }[]> {
        return apiService.get<{ date: string; value: number }[]>(`/kpis/${kpiId}/history`, { limit });
    }
}

export const kpiService = new KPIService();
