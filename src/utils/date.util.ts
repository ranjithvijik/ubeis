// ============================================
// Date Utilities
// ============================================

export const formatISO = (date: Date = new Date()): string => {
    return date.toISOString();
};

export const formatDate = (date: Date = new Date()): string => {
    return date.toISOString().split('T')[0];
};

export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const addHours = (date: Date, hours: number): Date => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
};

export const getPeriodStart = (period: string, from: Date = new Date()): Date => {
    const date = new Date(from);
    const targetMonth = date.getMonth();

    switch (period) {
        case 'daily':
            date.setDate(date.getDate() - 1);
            break;
        case 'weekly':
            date.setDate(date.getDate() - 7);
            break;
        case 'monthly':
            // FIX: Safe end-of-month calculation
            date.setMonth(targetMonth - 1);
            if (date.getMonth() !== ((targetMonth - 1 + 12) % 12)) {
                date.setDate(0);
            }
            break;
        case 'quarterly':
            date.setMonth(targetMonth - 3);
            if (date.getMonth() !== ((targetMonth - 3 + 12) % 12)) {
                date.setDate(0);
            }
            break;
        case 'yearly':
            date.setFullYear(date.getFullYear() - 1);
            break;
        default:
            date.setMonth(targetMonth - 1);
            if (date.getMonth() !== ((targetMonth - 1 + 12) % 12)) {
                date.setDate(0);
            }
    }

    return date;
};

export const getUnixTimestamp = (date: Date = new Date()): number => {
    return Math.floor(date.getTime() / 1000);
};

export const fromUnixTimestamp = (timestamp: number): Date => {
    return new Date(timestamp * 1000);
};
