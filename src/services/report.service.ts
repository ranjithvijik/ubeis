// ============================================
// Report Service
// ============================================

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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

    async deleteReport(userId: string, reportId: string): Promise<void> {
        const existing = await this.reportRepository.getById(userId, reportId);
        if (!existing) {
            // Nothing to do if it doesn't exist or doesn't belong to this user
            return;
        }

        // Best-effort delete of underlying S3 object
        try {
            if (existing.s3Bucket && existing.s3Key) {
                await this.s3.send(
                    new DeleteObjectCommand({
                        Bucket: existing.s3Bucket,
                        Key: existing.s3Key,
                    })
                );
            }
        } catch (err) {
            this.logger.warn('Failed to delete report object from S3', {
                reportId,
                error: (err as Error).message,
            });
        }

        await this.reportRepository.delete(userId, reportId);
        this.logger.info('Report deleted', { reportId, userId });
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
                doc.fillColor('#0f172a').fontSize(20).text(title, { align: 'left' });
                doc.fontSize(10).fillColor('#64748b').text(`Generated: ${new Date().toLocaleString()}`);
                doc.moveDown(1);

                // Summary block
                doc.fontSize(12).fillColor('#0f172a').text('Executive Summary', { underline: false });
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
                        idx === 1 ? '#16a34a' : idx === 2 ? '#eab308' : idx === 3 ? '#dc2626' : '#0f172a';

                    doc.fillColor('#94a3b8').text(item.label, 50, y, { continued: true });
                    doc.fillColor(labelColor).text(String(item.value), { align: 'left' });
                });

                doc.moveDown(1);

                // CXO Insights: highlight underperforming metrics prominently
                const kpis = dashboard.kpis;
                const underperforming = kpis.filter((k) => k.status === 'below_target');
                const atRisk = kpis.filter((k) => k.status === 'at_risk');

                // Sort by gap to target (largest gap first)
                const sortByGapDesc = (list: typeof kpis) =>
                    [...list].sort((a, b) => {
                        const gapA = a.targetValue ? (a.targetValue - a.currentValue) / Math.abs(a.targetValue) : 0;
                        const gapB = b.targetValue ? (b.targetValue - b.currentValue) / Math.abs(b.targetValue) : 0;
                        return gapB - gapA;
                    });

                const topBelow = sortByGapDesc(underperforming).slice(0, 5);
                const topAtRisk = sortByGapDesc(atRisk).slice(0, 5);

                if (topBelow.length || topAtRisk.length) {
                    doc.fillColor('#0f172a').fontSize(12).text('Key Risks & Underperforming Metrics');
                    doc.moveDown(0.5);
                    doc.fontSize(9);

                    if (topBelow.length) {
                        doc.fillColor('#dc2626').text('Critical (Below Target):');
                        doc.moveDown(0.25);
                        topBelow.forEach((k) => {
                            const gapPercent = k.targetValue
                                ? (((k.targetValue - k.currentValue) / Math.abs(k.targetValue)) * 100).toFixed(1)
                                : '0.0';
                            doc
                                .fillColor('#0f172a')
                                .text(`• ${k.name}`, { indent: 10, continued: true })
                                .fillColor('#64748b')
                                .text(
                                    `  | Current: ${k.currentValue} ${k.unit}  Target: ${k.targetValue} ${k.unit}  Gap: ${gapPercent}%`,
                                    { continued: false }
                                );
                        });
                        doc.moveDown(0.5);
                    }

                    if (topAtRisk.length) {
                        doc.fillColor('#eab308').text('At Risk (Approaching Thresholds):');
                        doc.moveDown(0.25);
                        topAtRisk.forEach((k) => {
                            const gapPercent = k.targetValue
                                ? (((k.targetValue - k.currentValue) / Math.abs(k.targetValue)) * 100).toFixed(1)
                                : '0.0';
                            doc
                                .fillColor('#0f172a')
                                .text(`• ${k.name}`, { indent: 10, continued: true })
                                .fillColor('#64748b')
                                .text(
                                    `  | Current: ${k.currentValue} ${k.unit}  Target: ${k.targetValue} ${k.unit}  Gap: ${gapPercent}%`,
                                    { continued: false }
                                );
                        });
                        doc.moveDown(1);
                    }
                }

                // KPI table
                doc.fillColor('#0f172a').fontSize(12).text('KPI Detail');
                doc.moveDown(0.75);

                // Simple tabular layout (no external table plugin)
                const colX = { name: 55, current: 265, target: 355, status: 455 };
                const startY = doc.y;
                // Header background with a bit more padding
                doc
                    .save()
                    .rect(45, startY - 4, 515, 20)
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
                        doc.rect(45, y - 2, 515, 18).fill('#f1f5f9');
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

                    // Slightly more generous row spacing
                    doc.moveDown(0.8);
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

        // Zebra striping + row heights for KPI rows
        ws.eachRow((row, rowNumber) => {
            // Header already styled
            if (rowNumber === 1) {
                row.height = 20;
                return;
            }
            row.height = 18;
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

        // Insights sheet: CXO-level view of underperforming metrics
        const wsInsights = wb.addWorksheet('Insights');
        wsInsights.columns = [
            { header: 'KPI Name', key: 'name', width: 40 },
            { header: 'Category', key: 'category', width: 14 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Current', key: 'currentValue', width: 14 },
            { header: 'Target', key: 'targetValue', width: 14 },
            { header: 'Gap to Target %', key: 'gapPercent', width: 16 },
            { header: 'Change %', key: 'changePercent', width: 14 },
        ];
        wsInsights.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        wsInsights.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        wsInsights.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0F172A' },
        };

        const underperforming = dashboard.kpis.filter((k) => k.status === 'below_target');
        const atRisk = dashboard.kpis.filter((k) => k.status === 'at_risk');

        const sortByGapDesc = (list: typeof dashboard.kpis) =>
            [...list].sort((a, b) => {
                const gapA = a.targetValue ? (a.targetValue - a.currentValue) / Math.abs(a.targetValue) : 0;
                const gapB = b.targetValue ? (b.targetValue - b.currentValue) / Math.abs(b.targetValue) : 0;
                return gapB - gapA;
            });

        const topBelow = sortByGapDesc(underperforming).slice(0, 10);
        const topAtRisk = sortByGapDesc(atRisk).slice(0, 10);

        const addInsightRow = (kpi: typeof dashboard.kpis[number]) => {
            const gapPercent = kpi.targetValue
                ? ((kpi.targetValue - kpi.currentValue) / Math.abs(kpi.targetValue)) * 100
                : 0;
            wsInsights.addRow({
                name: kpi.name,
                category: kpi.category,
                status: String(kpi.status).replace(/_/g, ' '),
                currentValue: kpi.currentValue,
                targetValue: kpi.targetValue,
                gapPercent,
                changePercent: kpi.changePercent,
            });
        };

        topBelow.forEach(addInsightRow);
        topAtRisk.forEach(addInsightRow);

        // Style insights rows – highlight critical vs at-risk
        wsInsights.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const statusCell = row.getCell('status');
            const statusValue = String(statusCell.value || '').toLowerCase();
            if (statusValue.includes('below')) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFEE2E2' }, // light red
                };
            } else if (statusValue.includes('risk')) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFEF9C3' }, // light yellow
                };
            }
        });
        wsInsights.getColumn('gapPercent').numFmt = '0.0"%"';
        wsInsights.getColumn('changePercent').numFmt = '0.0"%"';

        const arr = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
        return Buffer.from(arr);
    }
}
