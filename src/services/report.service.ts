// ============================================
// Report Service
// ============================================

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

import { ReportRepository } from '../repositories/report.repository';
import { DashboardService } from './dashboard.service';
import {
    Report,
    ReportType,
    ReportFormat,
    GenerateReportRequest,
    QueryOptions,
    UserContext,
    DashboardResponse,
} from '../types';
import { Logger } from '../utils/logger.util';

const REPORTS_BUCKET = process.env.REPORTS_BUCKET || '';
const REPORT_DOWNLOAD_EXPIRY_SECONDS = 3600; // 1 hour

export class ReportService {
    private reportRepository: ReportRepository;
    private dashboardService: DashboardService;
    private s3: S3Client;
    private logger: Logger;

    constructor() {
        this.reportRepository = new ReportRepository();
        this.dashboardService = new DashboardService();
        this.s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
        this.logger = new Logger('ReportService');
    }

    async listReports(userId: string, options?: QueryOptions): Promise<{ items: Report[]; nextToken?: string; count: number }> {
        const result = await this.reportRepository.getByUserId(userId, options);
        return {
            items: result.items,
            nextToken: result.nextToken,
            count: result.items.length,
        };
    }

    async getReportById(userId: string, reportId: string): Promise<Report | null> {
        return this.reportRepository.getById(userId, reportId);
    }

    async getDownloadUrl(userId: string, reportId: string): Promise<string | null> {
        const report = await this.reportRepository.getById(userId, reportId);
        if (!report || !REPORTS_BUCKET) return null;

        const command = new GetObjectCommand({
            Bucket: report.s3Bucket,
            Key: report.s3Key,
        });
        const url = await getSignedUrl(this.s3, command, { expiresIn: REPORT_DOWNLOAD_EXPIRY_SECONDS });
        return url;
    }

    async generateReport(user: UserContext, request: GenerateReportRequest): Promise<Report & { downloadUrl?: string }> {
        if (!REPORTS_BUCKET) {
            throw new Error('Reports bucket not configured (REPORTS_BUCKET)');
        }

        const reportId = uuidv4();
        const now = new Date();
        const generatedAt = now.toISOString();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

        // Build report content from dashboard data
        const category = request.type === 'executive_summary' || request.type === 'custom' ? 'all' : request.type;
        const dashboard = await this.dashboardService.getDashboard({
            userId: user.userId,
            role: user.role,
            department: user.department,
            college: user.college,
            period: 'monthly',
            category,
        });

        const content = this.buildReportContent(request.format, request.type, dashboard, request);
        const ext = 'csv';
        const contentType = 'text/csv';
        const s3Key = `reports/${user.userId}/${reportId}.${ext}`;

        await this.s3.send(
            new PutObjectCommand({
                Bucket: REPORTS_BUCKET,
                Key: s3Key,
                Body: content,
                ContentType: contentType,
            })
        );

        const fileSize = Buffer.byteLength(content, 'utf8');
        const report: Report = {
            reportId,
            userId: user.userId,
            type: request.type,
            title: request.title,
            description: request.description,
            format: request.format,
            parameters: request.parameters || {},
            s3Key,
            s3Bucket: REPORTS_BUCKET,
            fileSize,
            generatedAt,
            expiresAt,
        };

        await this.reportRepository.create(report);
        this.logger.info('Report generated', { reportId, userId: user.userId, type: request.type, format: request.format });

        const downloadUrl = await this.getDownloadUrl(user.userId, reportId);
        return { ...report, downloadUrl: downloadUrl || undefined };
    }

    private buildReportContent(
        _format: ReportFormat,
        type: ReportType,
        dashboard: DashboardResponse,
        request: GenerateReportRequest
    ): string {
        // MVP: all formats (csv, excel, pdf) output CSV content
        const rows: string[] = [
            'Report,' + (request.title || type),
            'Generated,' + new Date().toISOString(),
            '',
            'Summary',
            'Total KPIs,' + dashboard.summary.totalKPIs,
            'On Target,' + dashboard.summary.kpisOnTarget,
            'At Risk,' + dashboard.summary.kpisAtRisk,
            'Below Target,' + dashboard.summary.kpisBelowTarget,
            '',
            'KPI Name,Current Value,Target Value,Unit,Status',
        ];
        for (const k of dashboard.kpis) {
            rows.push([k.name, k.currentValue, k.targetValue, k.unit, k.status].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','));
        }
        return rows.join('\n');
    }
}
