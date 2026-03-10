// ============================================
// API Response Utilities
// ============================================

import { APIGatewayProxyResult } from 'aws-lambda';
import { APIResponse, APIError, APIMeta } from '../types';
import {
    CORS_HEADERS,
    HTTP_STATUS,
    API_VERSION,
    ERROR_CODES,
} from '../constants/api.constants';

const createMeta = (requestId?: string): APIMeta => ({
    requestId: requestId || 'unknown',
    timestamp: new Date().toISOString(),
    version: API_VERSION,
});

export const success = <T>(
    data: T,
    statusCode: number = HTTP_STATUS.OK,
    requestId?: string
): APIGatewayProxyResult => {
    const response: APIResponse<T> = {
        success: true,
        data,
        meta: createMeta(requestId),
    };

    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(response),
    };
};

export const created = <T>(data: T, requestId?: string): APIGatewayProxyResult => {
    return success(data, HTTP_STATUS.CREATED, requestId);
};

export const noContent = (): APIGatewayProxyResult => {
    return {
        statusCode: HTTP_STATUS.NO_CONTENT,
        headers: CORS_HEADERS,
        body: '',
    };
};

export const error = (
    code: string,
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_ERROR,
    details?: unknown,
    requestId?: string
): APIGatewayProxyResult => {
    const errorResponse: APIError = {
        code,
        message,
        details,
    };

    const response: APIResponse = {
        success: false,
        error: errorResponse,
        meta: createMeta(requestId),
    };

    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(response),
    };
};

export const badRequest = (
    message: string,
    details?: unknown,
    requestId?: string
): APIGatewayProxyResult => {
    return error('VALIDATION_ERROR', message, HTTP_STATUS.BAD_REQUEST, details, requestId);
};

export const unauthorized = (
    message: string = 'Authentication required',
    requestId?: string
): APIGatewayProxyResult => {
    return error('UNAUTHORIZED', message, HTTP_STATUS.UNAUTHORIZED, undefined, requestId);
};

export const forbidden = (
    message: string = 'Insufficient permissions',
    requestId?: string
): APIGatewayProxyResult => {
    return error('FORBIDDEN', message, HTTP_STATUS.FORBIDDEN, undefined, requestId);
};

export const notFound = (
    resource: string,
    id: string,
    requestId?: string
): APIGatewayProxyResult => {
    return error(
        'NOT_FOUND',
        `${resource} with id '${id}' not found`,
        HTTP_STATUS.NOT_FOUND,
        undefined,
        requestId
    );
};

export const internalError = (
    message: string = 'An unexpected error occurred',
    requestId?: string
): APIGatewayProxyResult => {
    return error('INTERNAL_ERROR', message, HTTP_STATUS.INTERNAL_ERROR, undefined, requestId);
};

/** 429 Too Many Requests - per API doc (optional retryAfter in body for clients) */
export const rateLimited = (
    message: string = 'Too many requests. Please retry later.',
    retryAfterSeconds?: number,
    requestId?: string
): APIGatewayProxyResult => {
    const body = error(
        ERROR_CODES.RATE_LIMITED,
        message,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        retryAfterSeconds != null ? { retryAfter: retryAfterSeconds } : undefined,
        requestId
    );
    const headers = {
        ...body.headers,
        ...(retryAfterSeconds != null && {
            'Retry-After': String(retryAfterSeconds),
        }),
    };
    return { ...body, headers };
};
