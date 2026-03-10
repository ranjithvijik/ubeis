// ============================================
// Error Handling Middleware
// ============================================

import { APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '../utils/logger.util';
import * as ResponseUtil from '../utils/response.util';
import { ValidationError } from '../utils/validation.util';
import { AuthenticationError, AuthorizationError } from './auth.middleware';

const logger = new Logger('ErrorMiddleware');

export const handleError = (
    error: Error,
    requestId?: string
): APIGatewayProxyResult => {
    logger.error('Error occurred', {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
    });

    if (error instanceof ValidationError) {
        return ResponseUtil.badRequest(error.message, error.details, requestId);
    }

    if (error instanceof AuthenticationError) {
        return ResponseUtil.unauthorized(error.message, requestId);
    }

    if (error instanceof AuthorizationError) {
        return ResponseUtil.forbidden(error.message, requestId);
    }

    if (error instanceof NotFoundError) {
        return ResponseUtil.notFound(error.resource, error.id, requestId);
    }

    // Default to internal error
    return ResponseUtil.internalError('An unexpected error occurred', requestId);
};

export class NotFoundError extends Error {
    constructor(
        public resource: string,
        public id: string
    ) {
        super(`${resource} with id '${id}' not found`);
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConflictError';
    }
}
