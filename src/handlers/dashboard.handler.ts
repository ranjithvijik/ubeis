// ============================================
// Dashboard Lambda Handler
// ============================================

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DashboardService } from '../services/dashboard.service';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { handleError } from '../middleware/error.middleware';
import * as ResponseUtil from '../utils/response.util';
import { validate, dashboardQuerySchema } from '../utils/validation.util';
import { Logger } from '../utils/logger.util';
import { DashboardRequest } from '../types';

const dashboardService = new DashboardService();
const logger = new Logger('DashboardHandler');

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const requestId = context.awsRequestId;
    logger.setRequestId(requestId);

    logger.info('Dashboard request received', {
        path: event.path,
        method: event.httpMethod,
    });

    try {
        // Extract user context
        const userContext = AuthMiddleware.extractUserContext(event);

        // Validate query parameters
        const queryParams = validate(dashboardQuerySchema, event.queryStringParameters || {});

        // Build request
        const request: DashboardRequest = {
            userId: userContext.userId,
            role: userContext.role,
            department: userContext.department,
            college: userContext.college,
            period: queryParams.period,
            category: queryParams.category === 'all' ? undefined : queryParams.category,
        };

        // Fetch dashboard data
        const dashboardData = await dashboardService.getDashboard(request);

        logger.info('Dashboard data retrieved', {
            kpiCount: dashboardData.kpis.length,
            alertCount: dashboardData.alerts.length,
        });

        return ResponseUtil.success(dashboardData, 200, requestId);
    } catch (error) {
        return handleError(error as Error, requestId);
    }
};
