// ============================================
// Reports Lambda Handler
// ============================================

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { handleError } from '../middleware/error.middleware';
import * as ResponseUtil from '../utils/response.util';
import { validate, generateReportSchema, paginationSchema } from '../utils/validation.util';
import { Logger } from '../utils/logger.util';

const logger = new Logger('ReportsHandler');

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const requestId = context.awsRequestId;
    logger.setRequestId(requestId);

    const method = event.httpMethod;
    const reportId = event.pathParameters?.reportId;
    const action = event.pathParameters?.action;

    logger.info('Reports request received', { method, reportId, action });

    try {
        const userContext = AuthMiddleware.extractUserContext(event);

        switch (method) {
            case 'GET': {
                if (reportId && action === 'download') {
                    // GET /reports/{reportId}/download
                    // Generate presigned URL for S3 download
                    return ResponseUtil.success(
                        {
                            downloadUrl: `https://s3.amazonaws.com/eis-reports/${reportId}`,
                            expiresIn: 3600,
                        },
                        200,
                        requestId
                    );
                }

                if (reportId) {
                    // GET /reports/{reportId}
                    return ResponseUtil.success(
                        { reportId, status: 'completed' },
                        200,
                        requestId
                    );
                }

                // GET /reports - List user's reports
                const queryParams = event.queryStringParameters || {};
                const pagination = validate(paginationSchema, queryParams) as {
                    limit: number;
                    nextToken?: string;
                };

                return ResponseUtil.success(
                    {
                        items: [],
                        count: 0,
                        nextToken: pagination.nextToken,
                    },
                    200,
                    requestId
                );
            }

            case 'POST': {
                // POST /reports/generate - restrict to roles that can generate reports
                AuthMiddleware.requireRole(userContext, ['admin', 'president', 'provost', 'cfo']);
                const body = JSON.parse(event.body || '{}');
                const generateRequest = validate(generateReportSchema, body) as {
                    type: string;
                    title: string;
                    format: string;
                    description?: string;
                    parameters?: Record<string, unknown>;
                };

                logger.info('Generating report', {
                    type: generateRequest.type,
                    format: generateRequest.format,
                });

                // In a real implementation, this would trigger async report generation
                return ResponseUtil.success(
                    {
                        reportId: 'report-' + Date.now(),
                        status: 'processing',
                        estimatedTime: '30 seconds',
                    },
                    202,
                    requestId
                );
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
