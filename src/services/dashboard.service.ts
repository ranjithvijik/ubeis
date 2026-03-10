// ============================================
// Dashboard Service
// ============================================

import { KPIRepository } from '../repositories/kpi.repository';
import { AlertRepository } from '../repositories/alert.repository';
import {
    DashboardRequest,
    DashboardResponse,
    DashboardSummary,
    KPI,
    Alert,
    UserRole,
    KPICategory,
} from '../types';
import { Logger } from '../utils/logger.util';
import { getPeriodStart } from '../utils/date.util';

export class DashboardService {
    private kpiRepository: KPIRepository;
    private alertRepository: AlertRepository;
    private logger: Logger;

    constructor() {
        this.kpiRepository = new KPIRepository();
        this.alertRepository = new AlertRepository();
        this.logger = new Logger('DashboardService');
    }

    async getDashboard(request: DashboardRequest): Promise<DashboardResponse> {
        this.logger.info('Fetching dashboard', {
            userId: request.userId,
            role: request.role,
            period: request.period,
        });

        // Fetch KPIs and alerts in parallel
        const [kpisResult, alertsResult] = await Promise.all([
            this.fetchKPIs(request),
            this.alertRepository.getActiveAlerts(undefined, { limit: 50 }),
        ]);

        // Filter based on role
        const filteredKPIs = this.filterKPIsByRole(kpisResult, request.role, request.department);
        const filteredAlerts = this.filterAlertsByRole(
            alertsResult.items,
            filteredKPIs.map((k) => k.kpiId)
        );

        // FIX: Batch-fetch history for each KPI (metadata only has empty history; history is stored as separate DynamoDB rows)
        const kpisWithHistory = await this.enrichKPIsWithHistory(filteredKPIs);

        // Apply period filtering to history
        const kpisWithFilteredHistory = this.filterHistoryByPeriod(kpisWithHistory, request.period);

        // Calculate summary
        const summary = this.calculateSummary(kpisWithFilteredHistory, filteredAlerts);

        this.logger.info('Dashboard fetched', {
            kpiCount: kpisWithFilteredHistory.length,
            alertCount: filteredAlerts.length,
        });

        return {
            summary,
            kpis: kpisWithFilteredHistory,
            alerts: filteredAlerts,
            generatedAt: new Date().toISOString(),
        };
    }

    private async fetchKPIs(request: DashboardRequest): Promise<KPI[]> {
        if (request.category && request.category !== 'all') {
            const result = await this.kpiRepository.getByCategory(
                request.category as KPICategory,
                { limit: 100 }
            );
            return result.items;
        }

        const result = await this.kpiRepository.getAll({ limit: 100 });
        return result.items;
    }

    private filterKPIsByRole(
        kpis: KPI[],
        role: UserRole,
        department?: string
    ): KPI[] {
        // Admin and President see everything
        if (role === 'admin' || role === 'president') {
            return kpis;
        }

        // Role-based category filtering
        const allowedCategories = this.getAllowedCategories(role);

        let filtered = kpis.filter((kpi) => allowedCategories.includes(kpi.category));

        // Department-level filtering for deans and chairs
        if ((role === 'dean' || role === 'department_chair') && department) {
            filtered = filtered.filter(
                (kpi) => !kpi.dataSource || kpi.dataSource.includes(department)
            );
        }

        return filtered;
    }

    private getAllowedCategories(role: UserRole): KPICategory[] {
        switch (role) {
            case 'provost':
                return ['enrollment', 'academic', 'research'];
            case 'cfo':
                return ['financial', 'operations'];
            case 'dean':
            case 'department_chair':
                return ['enrollment', 'academic'];
            case 'viewer':
                return ['enrollment', 'academic', 'financial'];
            default:
                return ['enrollment', 'financial', 'academic', 'research', 'operations'];
        }
    }

    private filterAlertsByRole(alerts: Alert[], allowedKPIIds: string[]): Alert[] {
        return alerts.filter((alert) => allowedKPIIds.includes(alert.kpiId));
    }

    /**
     * Fetches history rows from DynamoDB for each KPI (SK: HISTORY#...).
     * Metadata items only have history: []; history is stored separately to avoid 400KB item limit.
     */
    private async enrichKPIsWithHistory(kpis: KPI[]): Promise<KPI[]> {
        const HISTORY_LIMIT = 30; // Rolling window for dashboard trend charts
        const enriched = await Promise.all(
            kpis.map(async (kpi) => {
                const historyResult = await this.kpiRepository.getHistory(kpi.kpiId, {
                    limit: HISTORY_LIMIT,
                });
                return { ...kpi, history: historyResult.items };
            })
        );
        return enriched;
    }

    private filterHistoryByPeriod(kpis: KPI[], period: string): KPI[] {
        const periodStart = getPeriodStart(period);

        return kpis.map((kpi) => ({
            ...kpi,
            history: kpi.history.filter((h) => new Date(h.date) >= periodStart),
        }));
    }

    private calculateSummary(kpis: KPI[], alerts: Alert[]): DashboardSummary {
        return {
            totalKPIs: kpis.length,
            kpisOnTarget: kpis.filter((k) => k.status === 'on_target').length,
            kpisAtRisk: kpis.filter((k) => k.status === 'at_risk').length,
            kpisBelowTarget: kpis.filter((k) => k.status === 'below_target').length,
            criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
            warningAlerts: alerts.filter((a) => a.severity === 'warning').length,
            infoAlerts: alerts.filter((a) => a.severity === 'info').length,
        };
    }
}
