// ============================================
// Authentication Middleware
// ============================================

import { APIGatewayProxyEvent } from 'aws-lambda';
import { UserContext, UserRole } from '../types';
import { Logger } from '../utils/logger.util';

const logger = new Logger('AuthMiddleware');

export class AuthMiddleware {
    static extractUserContext(event: APIGatewayProxyEvent): UserContext {
        const claims = event.requestContext.authorizer?.claims;

        if (!claims) {
            throw new AuthenticationError('No authentication claims found');
        }

        const userId = claims.sub || claims['cognito:username'];
        const email = claims.email;
        const role = (claims['custom:role'] || 'viewer') as UserRole;
        const department = claims['custom:department'];
        const college = claims['custom:college'];

        if (!userId || !email) {
            throw new AuthenticationError('Invalid authentication claims');
        }

        logger.debug('User context extracted', { userId, role });

        return {
            userId,
            email,
            role,
            department,
            college,
        };
    }

    static requireRole(userContext: UserContext, allowedRoles: UserRole[]): void {
        if (!allowedRoles.includes(userContext.role) && userContext.role !== 'admin') {
            throw new AuthorizationError(
                `Role '${userContext.role}' is not authorized for this action`
            );
        }
    }

    static isAuthenticated(event: APIGatewayProxyEvent): boolean {
        return !!event.requestContext.authorizer?.claims?.sub;
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthorizationError';
    }
}
