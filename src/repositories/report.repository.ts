// ============================================
// Report Repository
// ============================================

import { BaseRepository } from './base.repository';
import { Report, QueryOptions } from '../types';
import { buildReportKey } from '../utils/dynamodb.util';

export class ReportRepository extends BaseRepository<Report> {
    constructor() {
        super('ReportRepository');
    }

    async getByUserId(userId: string, options?: QueryOptions): Promise<{ items: Report[]; nextToken?: string }> {
        const pk = `USER#${userId}`;
        const result = await this.query(
            {
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':sk': 'REPORT#',
                },
            },
            { ...options, sortOrder: 'desc' }
        );

        const items = (result.items as unknown as Record<string, unknown>[]).map((i) => this.mapToReport(i));
        return { items, nextToken: result.nextToken };
    }

    async getById(userId: string, reportId: string): Promise<Report | null> {
        const { PK, SK } = buildReportKey(userId, reportId);
        const item = await this.getItem(PK, SK);
        if (!item) return null;
        return this.mapToReport(item as unknown as Record<string, unknown>);
    }

    async create(report: Report): Promise<void> {
        const item = {
            PK: `USER#${report.userId}`,
            SK: `REPORT#${report.reportId}`,
            reportId: report.reportId,
            userId: report.userId,
            type: report.type,
            title: report.title,
            description: report.description,
            format: report.format,
            parameters: report.parameters || {},
            s3Key: report.s3Key,
            s3Bucket: report.s3Bucket,
            fileSize: report.fileSize,
            generatedAt: report.generatedAt,
            expiresAt: report.expiresAt,
        };
        await this.putItem(item);
    }

    private mapToReport(item: Record<string, unknown>): Report {
        return {
            reportId: item.reportId as string,
            userId: item.userId as string,
            type: item.type as Report['type'],
            title: item.title as string,
            description: item.description as string | undefined,
            format: item.format as Report['format'],
            parameters: (item.parameters as Record<string, unknown>) || {},
            s3Key: item.s3Key as string,
            s3Bucket: item.s3Bucket as string,
            fileSize: (item.fileSize as number) ?? 0,
            generatedAt: item.generatedAt as string,
            expiresAt: item.expiresAt as string,
        };
    }
}
