import { apiService } from './api.service';
import { DashboardData, DashboardFilters } from '../types';

class DashboardService {
    async getDashboard(filters: DashboardFilters): Promise<DashboardData> {
        return apiService.get<DashboardData>('/dashboard', {
            period: filters.period,
            category: filters.category === 'all' ? undefined : filters.category,
        });
    }
}

export const dashboardService = new DashboardService();
