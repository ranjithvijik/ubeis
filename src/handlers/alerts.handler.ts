// ============================================
// Alerts Lambda Handler
// ============================================

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { AlertService } from '../services/alert.service';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { handleError } from '../middleware/error.middleware';
import * as ResponseUtil from '../utils/response.util';
import { validate, paginationSchema, acknowledgeAlertSchema } from '../utils/validation.util';
import { Logger } from '../utils/logger.util';
import { AlertSeverity } from '../types';

const alertService = new AlertService();
const logger = new Logger('AlertsHandler');

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const requestId = context.awsRequestId;
    logger.setRequestId(requestId);

    const method = event.httpMethod;
    const alertId = event.pathParameters?.alertId;
    const action = event.pathParameters?.action;

    logger.info('Alerts request received', { method, alertId, action });

    try {
        const userContext = AuthMiddleware.extractUserContext(event);

        switch (method) {
            case 'GET': {
                if (alertId) {
                    // GET /alerts/{alertId}
                    const alert = await alertService.getAlertById(alertId);
                    return ResponseUtil.success(alert, 200, requestId);
                } else {
                    // GET /alerts?severity=critical
                    const queryParams = event.queryStringParameters || {};
                    const pagination = validate(paginationSchema, queryParams);
                    const severity = queryParams.severity as AlertSeverity | undefined;

                    const result = await alertService.getActiveAlerts(severity, pagination);
                    return ResponseUtil.success(result, 200, requestId);
                }
            }

            case 'POST': {
                if (alertId && action === 'acknowledge') {
                    // POST /alerts/{alertId}/acknowledge
                    const body = JSON.parse(event.body || '{}');
                    const ackRequest = validate(acknowledgeAlertSchema, {
                        ...body,
                        acknowledgedBy: userContext.userId,
                    });

                    const alert = await alertService.acknowledgeAlert(alertId, ackRequest.acknowledgedBy);
                    return ResponseUtil.success(alert, 200, requestId);
                }

                if (alertId && action === 'resolve') {
                    // POST /alerts/{alertId}/resolve
                    AuthMiddleware.requireRole(userContext, ['admin']);

                    const alert = await alertService.resolveAlert(alertId);
                    return ResponseUtil.success(alert, 200, requestId);
                }

                return ResponseUtil.badRequest('Invalid action', undefined, requestId);
            }

            case 'DELETE': {
                // DELETE /alerts/{alertId}
                if (!alertId) {
                    return ResponseUtil.badRequest('Alert ID is required', undefined, requestId);
                }

                AuthMiddleware.requireRole(userContext, ['admin']);

                await alertService.deleteAlert(alertId);
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
