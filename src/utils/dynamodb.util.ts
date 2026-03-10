// ============================================
// DynamoDB Utilities
// ============================================

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    QueryCommand,
    QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

export const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: false,
    },
});

export const TABLE_NAME = process.env.DYNAMODB_TABLE || 'EIS-Data';

// Key Builders
export const buildUserKey = (userId: string) => ({
    PK: `USER#${userId}`,
    SK: 'PROFILE',
});

export const buildKPIKey = (kpiId: string) => ({
    PK: `KPI#${kpiId}`,
    SK: 'METADATA',
});

export const buildKPIHistoryKey = (kpiId: string, date: string) => ({
    PK: `KPI#${kpiId}`,
    SK: `HISTORY#${date}`,
});

export const buildAlertKey = (alertId: string) => ({
    PK: `ALERT#${alertId}`,
    SK: 'METADATA',
});

export const buildReportKey = (userId: string, reportId: string) => ({
    PK: `USER#${userId}`,
    SK: `REPORT#${reportId}`,
});

// GSI Key Builders
export const buildCategoryGSI = (category: string, kpiId: string) => ({
    GSI1PK: `CATEGORY#${category}`,
    GSI1SK: `KPI#${kpiId}`,
});

export const buildActiveAlertGSI = (severity: string, timestamp: string) => ({
    GSI1PK: 'ALERT#ACTIVE',
    GSI1SK: `${severity}#${timestamp}`,
});

// Query Helper
export const queryItems = async <T>(
    params: QueryCommandInput
): Promise<{ items: T[]; nextToken?: string }> => {
    const result = await docClient.send(new QueryCommand(params));

    return {
        items: (result.Items || []) as T[],
        nextToken: result.LastEvaluatedKey
            ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
            : undefined,
    };
};

// Decode pagination token
export const decodeNextToken = (token?: string): Record<string, unknown> | undefined => {
    if (!token) return undefined;

    try {
        return JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    } catch {
        return undefined;
    }
};
