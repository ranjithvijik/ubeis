import { http, HttpResponse } from 'msw';

const API_URL = '/api';

export const handlers = [
    // Dashboard endpoint
    http.get(`${API_URL}/dashboard`, () => {
        return HttpResponse.json({
            success: true,
            data: {
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
                generatedAt: new Date().toISOString(),
            },
        });
    }),

    // KPIs endpoints
    http.get(`${API_URL}/kpis`, () => {
        return HttpResponse.json({
            success: true,
            data: {
                items: [],
                count: 0,
            },
        });
    }),

    http.get(`${API_URL}/kpis/:kpiId`, ({ params }) => {
        return HttpResponse.json({
            success: true,
            data: {
                kpiId: params.kpiId,
                name: 'Test KPI',
                category: 'enrollment',
                currentValue: 5000,
                status: 'on_target',
            },
        });
    }),

    // Alerts endpoints
    http.get(`${API_URL}/alerts`, () => {
        return HttpResponse.json({
            success: true,
            data: {
                items: [],
                count: 0,
            },
        });
    }),

    http.post(`${API_URL}/alerts/:alertId/acknowledge`, ({ params }) => {
        return HttpResponse.json({
            success: true,
            data: {
                alertId: params.alertId,
                status: 'acknowledged',
            },
        });
    }),
];
