// ============================================
// API Gateway Event Types
// ============================================

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { UserContext } from './index';

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
    userContext: UserContext;
}

export type LambdaHandler = (
    event: APIGatewayProxyEvent,
    context: Context
) => Promise<APIGatewayProxyResult>;

export interface HandlerConfig {
    requireAuth: boolean;
    allowedRoles?: string[];
    rateLimit?: number;
}
