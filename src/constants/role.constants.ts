// ============================================
// Role & Permission Constants
// ============================================

import { UserRole } from '../types';

export const USER_ROLES: UserRole[] = [
    'admin',
    'president',
    'provost',
    'cfo',
    'dean',
    'department_chair',
    'viewer',
];

export type Permission = string;

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    admin: ['*'],
    president: [
        'dashboard:read',
        'kpis:read',
        'kpis:read:all',
        'alerts:read',
        'alerts:acknowledge',
        'reports:read',
        'reports:generate',
    ],
    provost: [
        'dashboard:read',
        'kpis:read',
        'kpis:read:academic',
        'kpis:read:enrollment',
        'alerts:read',
        'alerts:acknowledge',
        'reports:read',
        'reports:generate',
    ],
    cfo: [
        'dashboard:read',
        'kpis:read',
        'kpis:read:financial',
        'kpis:read:operations',
        'alerts:read',
        'alerts:acknowledge',
        'reports:read',
        'reports:generate',
    ],
    dean: [
        'dashboard:read:college',
        'kpis:read:college',
        'alerts:read:college',
        'reports:read:college',
    ],
    department_chair: [
        'dashboard:read:department',
        'kpis:read:department',
        'alerts:read:department',
    ],
    viewer: [
        'dashboard:read',
        'kpis:read',
    ],
};

export const hasPermission = (
    role: UserRole,
    requiredPermission: Permission
): boolean => {
    const permissions = ROLE_PERMISSIONS[role];

    if (permissions.includes('*')) {
        return true;
    }

    return permissions.some(
        (p) =>
            p === requiredPermission ||
            requiredPermission.startsWith(p.replace(':*', ''))
    );
};
