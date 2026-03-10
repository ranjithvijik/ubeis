// ============================================
// Base Repository
// ============================================

import {
    GetCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand,
    QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, queryItems, decodeNextToken } from '../utils/dynamodb.util';
import { QueryOptions } from '../types';
import { Logger } from '../utils/logger.util';

export abstract class BaseRepository<T> {
    protected logger: Logger;
    protected tableName: string;

    constructor(serviceName: string) {
        this.logger = new Logger(serviceName);
        this.tableName = TABLE_NAME;
    }

    protected async getItem(pk: string, sk: string): Promise<T | null> {
        const result = await docClient.send(
            new GetCommand({
                TableName: this.tableName,
                Key: { PK: pk, SK: sk },
            })
        );

        return result.Item as T | null;
    }

    protected async putItem(item: Record<string, unknown>): Promise<void> {
        await docClient.send(
            new PutCommand({
                TableName: this.tableName,
                Item: item,
            })
        );
    }

    protected async updateItem(
        pk: string,
        sk: string,
        updates: Record<string, unknown>
    ): Promise<T> {
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, unknown> = {};

        Object.entries(updates).forEach(([key, value], index) => {
            const attrName = `#attr${index}`;
            const attrValue = `:val${index}`;

            updateExpressions.push(`${attrName} = ${attrValue}`);
            expressionAttributeNames[attrName] = key;
            expressionAttributeValues[attrValue] = value;
        });

        const result = await docClient.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { PK: pk, SK: sk },
                UpdateExpression: `SET ${updateExpressions.join(', ')}`,
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues,
                ReturnValues: 'ALL_NEW',
            })
        );

        return result.Attributes as T;
    }

    protected async deleteItem(pk: string, sk: string): Promise<void> {
        await docClient.send(
            new DeleteCommand({
                TableName: this.tableName,
                Key: { PK: pk, SK: sk },
            })
        );
    }

    protected async query(
        params: Omit<QueryCommandInput, 'TableName'>,
        options?: QueryOptions
    ): Promise<{ items: T[]; nextToken?: string }> {
        const queryParams: QueryCommandInput = {
            TableName: this.tableName,
            ...params,
            Limit: options?.limit || 20,
            ExclusiveStartKey: decodeNextToken(options?.nextToken),
            ScanIndexForward: options?.sortOrder !== 'desc',
        };

        return queryItems<T>(queryParams);
    }
}
