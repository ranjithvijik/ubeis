/**
 * Minimal type declarations for aws-lambda when @types/aws-lambda is not resolved.
 * Install dependencies (npm install) for full types from @types/aws-lambda.
 */
declare module 'aws-lambda' {
    export interface APIGatewayProxyEvent {
        httpMethod: string;
        path: string;
        pathParameters?: Record<string, string | undefined> | null;
        queryStringParameters?: Record<string, string | undefined> | null;
        body: string | null;
        requestContext: {
            requestId: string;
            authorizer?: {
                claims?: {
                    sub?: string;
                    email?: string;
                    'cognito:username'?: string;
                    'custom:role'?: string;
                    'custom:department'?: string;
                    'custom:college'?: string;
                    [key: string]: unknown;
                };
                [key: string]: unknown;
            } | null;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    }

    export interface APIGatewayProxyResult {
        statusCode: number;
        headers?: Record<string, string>;
        body: string;
    }

    export interface Context {
        awsRequestId: string;
        [key: string]: unknown;
    }

    export interface DynamoDBStreamEvent {
        Records: DynamoDBRecord[];
    }

    export interface DynamoDBRecord {
        eventID?: string;
        eventName?: 'INSERT' | 'MODIFY' | 'REMOVE';
        dynamodb?: {
            NewImage?: Record<string, unknown>;
            OldImage?: Record<string, unknown>;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    }
}
