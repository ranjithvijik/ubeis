// ============================================
// User Repository
// ============================================

import { BaseRepository } from './base.repository';
import { User, UserPreferences, UserRole } from '../types';
import { buildUserKey } from '../utils/dynamodb.util';
import { formatISO } from '../utils/date.util';

export class UserRepository extends BaseRepository<User> {
    constructor() {
        super('UserRepository');
    }

    async getById(userId: string): Promise<User | null> {
        const { PK, SK } = buildUserKey(userId);
        const item = await this.getItem(PK, SK);

        if (!item) return null;

        return this.mapToUser(item as unknown as Record<string, unknown>);
    }

    async getByEmail(email: string): Promise<User | null> {
        const result = await this.query({
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
            ExpressionAttributeValues: {
                ':pk': `EMAIL#${email.toLowerCase()}`,
            },
            Limit: 1,
        });

        if (result.items.length === 0) return null;

        return this.mapToUser(result.items[0] as unknown as Record<string, unknown>);
    }

    async create(user: Omit<User, 'createdAt' | 'lastLoginAt'>): Promise<User> {
        const now = formatISO();

        const fullUser: User = {
            ...user,
            createdAt: now,
            lastLoginAt: now,
        };

        const { PK, SK } = buildUserKey(user.userId);

        await this.putItem({
            PK,
            SK,
            GSI1PK: `EMAIL#${user.email.toLowerCase()}`,
            GSI1SK: `USER#${user.userId}`,
            ...fullUser,
        });

        this.logger.info('User created', { userId: user.userId });

        return fullUser;
    }

    async updatePreferences(
        userId: string,
        preferences: Partial<UserPreferences>
    ): Promise<User> {
        const { PK, SK } = buildUserKey(userId);

        const existing = await this.getById(userId);
        if (!existing) {
            throw new Error(`User ${userId} not found`);
        }

        const updatedPreferences = {
            ...existing.preferences,
            ...preferences,
        };

        const updated = await this.updateItem(PK, SK, {
            preferences: updatedPreferences,
        });

        this.logger.info('User preferences updated', { userId });

        return this.mapToUser(updated as unknown as Record<string, unknown>);
    }

    async updateLastLogin(userId: string): Promise<void> {
        const { PK, SK } = buildUserKey(userId);

        await this.updateItem(PK, SK, {
            lastLoginAt: formatISO(),
        });

        this.logger.debug('User last login updated', { userId });
    }

    private mapToUser(item: Record<string, unknown>): User {
        return {
            userId: item.userId as string,
            email: item.email as string,
            firstName: item.firstName as string,
            lastName: item.lastName as string,
            role: item.role as UserRole,
            department: item.department as string | undefined,
            college: item.college as string | undefined,
            preferences: item.preferences as UserPreferences,
            createdAt: item.createdAt as string,
            lastLoginAt: item.lastLoginAt as string,
        };
    }
}
