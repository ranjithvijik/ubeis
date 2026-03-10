// ============================================
// KPIs Lambda Handler
// ============================================

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { KPIService } from '../services/kpi.service';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { handleError } from '../middleware/error.middleware';
import * as ResponseUtil from '../utils/response.util';
import {
    validate,
    createKPISchema,
    updateKPISchema,
    paginationSchema,
    kpiDetailQuerySchema,
} from '../utils/validation.util';
import { Logger } from '../utils/logger.util';
import { KPICategory } from '../types';

const kpiService = new KPIService();
const logger = new Logger('KPIsHandler');

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const requestId = context.awsRequestId;
    logger.setRequestId(requestId);

    const method = event.httpMethod;
    const kpiId = event.pathParameters?.kpiId;

    logger.info('KPIs request received', { method, kpiId });

    try {
        const userContext = AuthMiddleware.extractUserContext(event);

        switch (method) {
            case 'GET': {
                if (kpiId) {
                    // GET /kpis/{kpiId} - optional includeHistory, historyLimit per API doc
                    const queryParams = event.queryStringParameters || {};
                    const opts = validate(kpiDetailQuerySchema, queryParams);
                    const kpi = await kpiService.getKPIById(kpiId, {
                        includeHistory: opts.includeHistory,
                        historyLimit: opts.historyLimit,
                    });
                    return ResponseUtil.success(kpi, 200, requestId);
                } else {
                    // GET /kpis?category=enrollment
                    const queryParams = event.queryStringParameters || {};
                    const pagination = validate(paginationSchema, queryParams);
                    const category = queryParams.category as KPICategory | undefined;

                    const result = await kpiService.getKPIs(category, pagination);
                    return ResponseUtil.success(result, 200, requestId);
                }
            }

            case 'POST': {
                // POST /kpis
                AuthMiddleware.requireRole(userContext, ['admin']);

                const body = JSON.parse(event.body || '{}');
                const createRequest = validate(createKPISchema, body);

                const kpi = await kpiService.createKPI(createRequest, userContext.userId);
                return ResponseUtil.created(kpi, requestId);
            }

            case 'PUT': {
                // PUT /kpis/{kpiId}
                if (!kpiId) {
                    return ResponseUtil.badRequest('KPI ID is required', undefined, requestId);
                }

                AuthMiddleware.requireRole(userContext, ['admin']);

                const body = JSON.parse(event.body || '{}');
                const updateRequest = validate(updateKPISchema, body);

                const kpi = await kpiService.updateKPI(kpiId, updateRequest, userContext.userId);
                return ResponseUtil.success(kpi, 200, requestId);
            }

            case 'DELETE': {
                // DELETE /kpis/{kpiId}
                if (!kpiId) {
                    return ResponseUtil.badRequest('KPI ID is required', undefined, requestId);
                }

                AuthMiddleware.requireRole(userContext, ['admin']);

                await kpiService.deleteKPI(kpiId);
                return ResponseUtil.noContent();
            }

            default:
                return ResponseUtil.error(
                    'METHOD_NOT_ALLOWED',
                    `Method ${method} not allowed`,
                    405,
                    undefined,
                    requestId
                );
        }
    } catch (error) {
        return handleError(error as Error, requestId);
    }
};
