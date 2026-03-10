// ============================================
// Logging Utility
// ============================================

import { Logger as PowerToolsLogger } from '@aws-lambda-powertools/logger';

export class Logger {
    private logger: PowerToolsLogger;

    constructor(serviceName: string) {
        this.logger = new PowerToolsLogger({
            serviceName,
            logLevel: process.env.LOG_LEVEL || 'INFO',
            persistentLogAttributes: {
                environment: process.env.ENVIRONMENT || 'dev',
                version: process.env.APP_VERSION || '1.0.0',
            },
        });
    }

    info(message: string, data?: Record<string, unknown>): void {
        this.logger.info(message, data);
    }

    warn(message: string, data?: Record<string, unknown>): void {
        this.logger.warn(message, data);
    }

    error(message: string, data?: Record<string, unknown>): void {
        this.logger.error(message, data);
    }

    debug(message: string, data?: Record<string, unknown>): void {
        this.logger.debug(message, data);
    }

    addContext(key: string, value: unknown): void {
        this.logger.appendKeys({ [key]: value });
    }

    setRequestId(requestId: string): void {
        this.logger.appendKeys({ requestId });
    }
}

export const createLogger = (serviceName: string): Logger => {
    return new Logger(serviceName);
};
