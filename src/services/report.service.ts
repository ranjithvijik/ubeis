// ============================================
// Report Service
// ============================================

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

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

type BuiltReport = { body: Buffer; ext: 'csv' | 'pdf' | 'xlsx'; contentType: string };

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

        const built = await this.buildReport(request.format, request.type, dashboard, request);
        const s3Key = `reports/${user.userId}/${reportId}.${built.ext}`;

        await this.s3.send(
            new PutObjectCommand({
                Bucket: REPORTS_BUCKET,
                Key: s3Key,
                Body: built.body,
                ContentType: built.contentType,
            })
        );

        const fileSize = built.body.byteLength;
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

    private async buildReport(
        format: ReportFormat,
        type: ReportType,
        dashboard: DashboardResponse,
        request: GenerateReportRequest
    ): Promise<BuiltReport> {
        if (format === 'csv') {
            const csv = this.buildCsv(type, dashboard, request);
            return { body: Buffer.from(csv, 'utf8'), ext: 'csv', contentType: 'text/csv' };
        }

        if (format === 'pdf') {
            const body = await this.buildPdf(type, dashboard, request);
            return { body, ext: 'pdf', contentType: 'application/pdf' };
        }

        // excel
        const body = await this.buildXlsx(type, dashboard, request);
        return {
            body,
            ext: 'xlsx',
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
    }

    private buildCsv(type: ReportType, dashboard: DashboardResponse, request: GenerateReportRequest): string {
        const rows: string[] = [
            `Report,${(request.title || type)}`,
            `Generated,${new Date().toISOString()}`,
            '',
            'Summary',
            `Total KPIs,${dashboard.summary.totalKPIs}`,
            `On Target,${dashboard.summary.kpisOnTarget}`,
            `At Risk,${dashboard.summary.kpisAtRisk}`,
            `Below Target,${dashboard.summary.kpisBelowTarget}`,
            '',
            'KPI Name,Current Value,Target Value,Unit,Status',
        ];
        for (const k of dashboard.kpis) {
            rows.push([k.name, k.currentValue, k.targetValue, k.unit, k.status].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','));
        }
        return rows.join('\n');
    }

    private buildPdf(type: ReportType, dashboard: DashboardResponse, request: GenerateReportRequest): Promise<Buffer> {
        const title = request.title || type;

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
                const chunks: Buffer[] = [];

                doc.on('data', (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Header
                doc
                    .fillColor('#0f172a')
                    .fontSize(20)
                    .text(title, { align: 'left' });

                doc
                    .fontSize(10)
                    .fillColor('#64748b')
                    .text(`Generated: ${new Date().toLocaleString()}`);

                doc.moveDown(1);

                // Summary block
                doc
                    .fontSize(12)
                    .fillColor('#0f172a')
                    .text('Executive Summary', { underline: false });
                doc.moveDown(0.5);

                doc.fontSize(10);

                const summaryData = [
                    { label: 'Total KPIs', value: dashboard.summary.totalKPIs },
                    { label: 'On Target', value: dashboard.summary.kpisOnTarget },
                    { label: 'At Risk', value: dashboard.summary.kpisAtRisk },
                    { label: 'Below Target', value: dashboard.summary.kpisBelowTarget },
                ];

                summaryData.forEach((item, idx) => {
                    const y = doc.y;
                    const labelColor =
                        idx === 1
                            ? '#16a34a'
                            : idx === 2
                                ? '#eab308'
                                : idx === 3
                                    ? '#dc2626'
                                    : '#0f172a';

                    doc
                        .fillColor('#94a3b8')
                        .text(item.label, 50, y, { continued: true });
                    doc
                        .fillColor(labelColor)
                        .text(String(item.value), { align: 'left' });
                });

                doc.moveDown(1);

                // KPI table
                doc.fillColor('#0f172a').fontSize(12).text('KPI Detail');
                doc.moveDown(0.5);

                // Simple tabular layout (no external table plugin)
                const colX = { name: 50, current: 260, target: 350, status: 450 };
                const startY = doc.y;
                // Header background
                doc
                    .save()
                    .rect(45, startY - 2, 515, 18)
                    .fill('#0f172a');
                doc.restore();

                doc.fontSize(9).fillColor('#f9fafb');
                doc.text('Name', colX.name, startY);
                doc.text('Current', colX.current, startY, { width: 80, align: 'right' });
                doc.text('Target', colX.target, startY, { width: 80, align: 'right' });
                doc.text('Status', colX.status, startY);
                doc.moveDown(0.6);
                doc.strokeColor('#DDDDDD').moveTo(50, doc.y).lineTo(560, doc.y).stroke();
                doc.moveDown(0.4);

                doc.fontSize(9).fillColor('#111827');
                const maxRows = 40;
                const rows = dashboard.kpis.slice(0, maxRows);
                rows.forEach((kpi, index) => {
                    const y = doc.y;

                    // Zebra striping
                    if (index % 2 === 1) {
                        doc.save();
                        doc.rect(45, y - 1, 515, 14).fill('#f1f5f9');
                        doc.restore();
                    }

                    doc.fillColor('#0f172a');
                    doc.text(String(kpi.name), colX.name, y, { width: 200 });

                    doc.fillColor('#0f172a');
                    doc.text(String(kpi.currentValue), colX.current, y, { width: 80, align: 'right' });
                    doc.text(String(kpi.targetValue), colX.target, y, { width: 80, align: 'right' });

                    const statusText = String(kpi.status).replace(/_/g, ' ');
                    const statusColor =
                        kpi.status === 'on_target'
                            ? '#16a34a'
                            : kpi.status === 'at_risk'
                                ? '#eab308'
                                : '#dc2626';
                    doc.fillColor(statusColor).text(statusText, colX.status, y);

                    doc.moveDown(0.6);
                    if (doc.y > 720) doc.addPage();
                });

                if (dashboard.kpis.length > maxRows) {
                    doc.moveDown(0.5);
                    doc.fillColor('#666666').fontSize(9).text(`Showing first ${maxRows} KPIs (of ${dashboard.kpis.length}).`);
                }

                doc.end();
            } catch (e) {
                reject(e);
            }
        });
    }

    private async buildXlsx(type: ReportType, dashboard: DashboardResponse, request: GenerateReportRequest): Promise<Buffer> {
        const title = request.title || type;
        const wb = new ExcelJS.Workbook();
        wb.creator = 'UBalt EIS';
        wb.created = new Date();

        const wsSummary = wb.addWorksheet('Summary');
        wsSummary.columns = [
            { header: 'Field', key: 'field', width: 28 },
            { header: 'Value', key: 'value', width: 32 },
        ];
        wsSummary.addRows([
            { field: 'Report', value: title },
            { field: 'Generated', value: new Date().toISOString() },
            { field: 'Total KPIs', value: dashboard.summary.totalKPIs },
            { field: 'On Target', value: dashboard.summary.kpisOnTarget },
            { field: 'At Risk', value: dashboard.summary.kpisAtRisk },
            { field: 'Below Target', value: dashboard.summary.kpisBelowTarget },
        ]);
        wsSummary.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        wsSummary.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0F172A' },
        };

        const ws = wb.addWorksheet('KPIs');
        ws.columns = [
            { header: 'KPI Name', key: 'name', width: 48 },
            { header: 'Category', key: 'category', width: 16 },
            { header: 'Current Value', key: 'currentValue', width: 16 },
            { header: 'Target Value', key: 'targetValue', width: 16 },
            { header: 'Unit', key: 'unit', width: 14 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Trend', key: 'trend', width: 12 },
            { header: 'Change %', key: 'changePercent', width: 12 },
            { header: 'Last Updated', key: 'lastUpdated', width: 22 },
        ];
        ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        ws.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0F172A' },
        };

        for (const kpi of dashboard.kpis) {
            ws.addRow({
                name: kpi.name,
                category: kpi.category,
                currentValue: kpi.currentValue,
                targetValue: kpi.targetValue,
                unit: kpi.unit,
                status: String(kpi.status).replace(/_/g, ' '),
                trend: kpi.trend,
                changePercent: kpi.changePercent,
                lastUpdated: kpi.lastUpdated,
            });
        }

        // Basic styling
        ws.views = [{ state: 'frozen', ySplit: 1 }];
        wsSummary.views = [{ state: 'frozen', ySplit: 1 }];

        // Zebra striping for KPI rows
        ws.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            if (rowNumber % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF9FAFB' },
                };
            }
        });

        // Number formatting for change %
        ws.getColumn('changePercent').numFmt = '0.0"%"';

        const arr = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
        return Buffer.from(arr);
    }
}
