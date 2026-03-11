// ============================================
// Admin Service - User Management via Cognito
// ============================================

import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    ListUsersCommand,
    AttributeType,
    UserType,
} from '@aws-sdk/client-cognito-identity-provider';
import { Logger } from '../utils/logger.util';
import type { UserRole } from '../types';

const REGION = process.env.AWS_REGION || 'us-east-1';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';

export interface AdminUserSummary {
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    status?: string;
    createdAt?: string;
}

export interface CreateAdminUserRequest {
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    temporaryPassword: string;
}

export class AdminService {
    private client: CognitoIdentityProviderClient;
    private logger: Logger;

    constructor() {
        // Lazy guard against misconfiguration in methods instead of crashing server at startup
        this.client = new CognitoIdentityProviderClient({ region: REGION });
        this.logger = new Logger('AdminService');
    }

    private getAttr(attrs: AttributeType[] | undefined, name: string): string | undefined {
        return attrs?.find((a) => a.Name === name)?.Value;
    }

    private mapUser(user: UserType): AdminUserSummary {
        const attrs = user.Attributes ?? [];
        const email = this.getAttr(attrs, 'email') ?? '';
        const firstName = this.getAttr(attrs, 'given_name') || this.getAttr(attrs, 'custom:firstName');
        const lastName = this.getAttr(attrs, 'family_name') || this.getAttr(attrs, 'custom:lastName');
        const role = (this.getAttr(attrs, 'custom:role') || 'viewer') as UserRole;

        return {
            username: user.Username ?? email,
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            role,
            status: user.UserStatus,
            createdAt: user.UserCreateDate?.toISOString(),
        };
    }

    async listUsers(limit = 50): Promise<AdminUserSummary[]> {
        if (!USER_POOL_ID) {
            throw new Error('Admin user listing is not configured: COGNITO_USER_POOL_ID is missing.');
        }
        const resp = await this.client.send(
            new ListUsersCommand({
                UserPoolId: USER_POOL_ID,
                Limit: limit,
            })
        );

        const users = (resp.Users ?? []).map((u) => this.mapUser(u));
        this.logger.info('Listed admin users from Cognito', { count: users.length });
        return users;
    }

    async createUser(payload: CreateAdminUserRequest): Promise<AdminUserSummary> {
        if (!USER_POOL_ID) {
            throw new Error('Admin user creation is not configured: COGNITO_USER_POOL_ID is missing.');
        }
        const { email, firstName, lastName, role, temporaryPassword } = payload;

        this.logger.info('Creating Cognito user', { email, role });

        // Create user without sending email
        await this.client.send(
            new AdminCreateUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: email,
                UserAttributes: [
                    { Name: 'email', Value: email },
                    { Name: 'email_verified', Value: 'true' },
                    { Name: 'custom:role', Value: role },
                    ...(firstName ? [{ Name: 'given_name', Value: firstName }] : []),
                    ...(lastName ? [{ Name: 'family_name', Value: lastName }] : []),
                ],
                MessageAction: 'SUPPRESS',
            })
        );

        // Set password
        await this.client.send(
            new AdminSetUserPasswordCommand({
                UserPoolId: USER_POOL_ID,
                Username: email,
                Password: temporaryPassword,
                Permanent: true,
            })
        );

        // Re-fetch created user for a clean summary
        const resp = await this.client.send(
            new ListUsersCommand({
                UserPoolId: USER_POOL_ID,
                Limit: 1,
                Filter: `email = "${email}"`,
            })
        );

        const user = (resp.Users ?? [])[0];
        if (!user) {
            throw new Error(`User ${email} created but could not be fetched from Cognito`);
        }

        const mapped = this.mapUser(user);
        this.logger.info('Admin user created in Cognito', { email, role });
        return mapped;
    }
}

