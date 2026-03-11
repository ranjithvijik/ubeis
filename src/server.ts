import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

import { DashboardService } from './services/dashboard.service';
import { KPIService } from './services/kpi.service';
import { AlertService } from './services/alert.service';
import { ReportService } from './services/report.service';
import { TransactionService } from './services/transaction.service';
import { Logger } from './utils/logger.util';
import {
    validate,
    dashboardQuerySchema,
    paginationSchema,
    kpiDetailQuerySchema,
    generateReportSchema,
} from './utils/validation.util';
import { ValidationError } from './utils/validation.util';
import { AuthenticationError, AuthorizationError } from './middleware/auth.middleware';
import { NotFoundError } from './middleware/error.middleware';
import type {
    UserContext,
    UserRole,
    KPICategory,
    DashboardRequest,
    AlertSeverity,
} from './types';

const app = express();
const port = process.env.PORT || 3000;
const logger = new Logger('HttpServer');

// Allow frontend (CloudFront + local)
const corsOrigin = process.env.CORS_ORIGIN || 'https://d2j0wdkaazlq7r.cloudfront.net';
app.use(cors({ origin: [corsOrigin, 'http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());

const dashboardService = new DashboardService();
const kpiService = new KPIService();
const alertService = new AlertService();
const reportService = new ReportService();
const transactionService = new TransactionService();

interface AuthenticatedRequest extends Request {
    user?: UserContext;
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        res.status(401).json({ message: 'Missing Authorization header' });
        return;
    }

    try {
        const decoded = jwt.decode(token) as any;

        if (!decoded) {
            throw new AuthenticationError('Invalid token');
        }

        const userId = decoded.sub || decoded['cognito:username'];
        const email = decoded.email;
        const role = (decoded['custom:role'] || 'viewer') as UserRole;
        const department = decoded['custom:department'];
        const college = decoded['custom:college'];

        if (!userId || !email) {
            throw new AuthenticationError('Invalid authentication claims');
        }

        req.user = {
            userId,
            email,
            role,
            department,
            college,
        };

        next();
    } catch (error) {
        logger.error('Authentication failed', { error });
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
};

const errorMiddleware = (error: Error, _req: Request, res: Response, _next: NextFunction): void => {
    logger.error('Error occurred', { error });

    if (error instanceof ValidationError) {
        res.status(400).json({
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: error.details,
        });
    }

    if (error instanceof AuthenticationError) {
        res.status(401).json({ code: 'UNAUTHORIZED', message: error.message });
        return;
    }

    if (error instanceof AuthorizationError) {
        res.status(403).json({ code: 'FORBIDDEN', message: error.message });
        return;
    }

    if (error instanceof NotFoundError) {
        res.status(404).json({
            code: 'NOT_FOUND',
            message: error.message,
            resource: (error as NotFoundError).resource,
            id: (error as NotFoundError).id,
        });
        return;
    }

    res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' });
};

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

app.use(authMiddleware);

app.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user as UserContext;
        const query = validate(dashboardQuerySchema, req.query as any);

        const request: DashboardRequest = {
            userId: user.userId,
            role: user.role,
            department: user.department,
            college: user.college,
            period: (query.period || 'monthly') as DashboardRequest['period'],
            category: query.category as KPICategory | 'all',
        };

        const data = await dashboardService.getDashboard(request);
        res.json({ data });
    } catch (error) {
        next(error);
    }
});

app.get('/kpis', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const pagination = validate(paginationSchema, req.query);
        const category = req.query.category as KPICategory | undefined;

        const result = await kpiService.getKPIs(category, pagination);
        res.json({ data: result });
    } catch (error) {
        next(error);
    }
});

app.get('/kpis/:kpiId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { kpiId } = req.params;
        const opts = validate(kpiDetailQuerySchema as any, req.query as any) as {
            includeHistory?: boolean;
            historyLimit?: number;
        };

        const kpi = await kpiService.getKPIById(kpiId, {
            includeHistory: opts.includeHistory,
            historyLimit: opts.historyLimit,
        });

        res.json({ data: kpi });
    } catch (error) {
        next(error);
    }
});

app.get('/kpis/:kpiId/transactions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { kpiId } = req.params;
        const pagination = validate(paginationSchema, req.query);
        const result = await transactionService.getTransactionsForKPI(kpiId, pagination);
        res.json({ data: result });
    } catch (error) {
        next(error);
    }
});

app.post('/kpis', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user as UserContext;
        if (user.role !== 'admin') {
            throw new AuthorizationError('Only admins can create KPIs');
        }

        const kpi = await kpiService.createKPI(req.body, user.userId);
        res.status(201).json({ data: kpi });
    } catch (error) {
        next(error);
    }
});

app.get('/alerts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const pagination = validate(paginationSchema, req.query);
        const severity = req.query.severity as AlertSeverity | undefined;

        const result = await alertService.getActiveAlerts(severity, pagination);
        res.json({ data: result });
    } catch (error) {
        next(error);
    }
});

app.get('/alerts/:alertId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { alertId } = req.params;
        const alert = await alertService.getAlertById(alertId);
        res.json({ data: alert });
    } catch (error) {
        next(error);
    }
});

app.post('/alerts/:alertId/acknowledge', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user as UserContext;
        const { alertId } = req.params;
        const alert = await alertService.acknowledgeAlert(alertId, user.userId);
        res.json({ data: alert });
    } catch (error) {
        next(error);
    }
});

app.post('/alerts/:alertId/resolve', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user as UserContext;
        if (user.role !== 'admin') {
            throw new AuthorizationError('Only admins can resolve alerts');
        }
        const { alertId } = req.params;
        const alert = await alertService.resolveAlert(alertId);
        res.json({ data: alert });
    } catch (error) {
        next(error);
    }
});

// Reports
app.get('/reports', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user as UserContext;
        const pagination = validate(paginationSchema, req.query);
        const result = await reportService.listReports(user.userId, pagination);
        res.json({ data: result });
    } catch (error) {
        next(error);
    }
});

app.post('/reports', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user as UserContext;
        const body = validate(generateReportSchema, req.body);
        const report = await reportService.generateReport(user, body);
        res.status(201).json({ data: report });
    } catch (error) {
        next(error);
    }
});

app.get('/reports/:reportId/download', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user as UserContext;
        const { reportId } = req.params;
        const downloadUrl = await reportService.getDownloadUrl(user.userId, reportId);
        if (!downloadUrl) {
            throw new NotFoundError('Report', reportId);
        }
        res.json({ data: { downloadUrl } });
    } catch (error) {
        next(error);
    }
});

app.delete('/reports/:reportId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user as UserContext;
        const { reportId } = req.params;
        await reportService.deleteReport(user.userId, reportId);
        res.status(200).json({ data: { success: true } });
    } catch (error) {
        next(error);
    }
});

app.use(errorMiddleware);

app.listen(port, () => {
    logger.info('HTTP server listening', { port });
});

