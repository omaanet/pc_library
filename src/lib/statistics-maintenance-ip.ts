import { SITE_CONFIG } from '@/config/site-config';
import { hashPromoVisitorIp } from '@/lib/promo-statistics';

export const MAINTENANCE_USER_EMAILS = ['oscar@omaa.it', 'paolo@omaa.it'] as const;

const LOCAL_MAINTENANCE_IPS = ['::1', 'localhost', '127.0.0.1'] as const;

function escapeSqlLiteral(value: string): string {
    return value.replace(/'/g, "''");
}

function sqlStringList(values: readonly string[]): string {
    return values.map((value) => `'${escapeSqlLiteral(value)}'`).join(', ');
}

function getExcludedMaintenanceIps(): string[] {
    return Array.from(new Set([
        ...LOCAL_MAINTENANCE_IPS,
        SITE_CONFIG.STATISTICS_MAINTENANCE_IP,
    ]));
}

export function shouldIncludeMaintenanceIp(request: Request): boolean {
    const { searchParams } = new URL(request.url);
    return searchParams.get('includeMaintenanceIp') !== 'false';
}

export function getMaintenanceIpFilter(request: Request, columnName = 'ip_address'): string {
    if (shouldIncludeMaintenanceIp(request)) {
        return '(1 = 1)';
    }

    return `(COALESCE(${columnName}, '') NOT IN (${sqlStringList(getExcludedMaintenanceIps())}))`;
}

export function getMaintenanceUserFilter(request: Request, userIdColumn = 'user_id'): string {
    if (shouldIncludeMaintenanceIp(request)) {
        return '(1 = 1)';
    }

    return `(${userIdColumn} IS NULL OR NOT EXISTS (
        SELECT 1
        FROM users maintenance_user_filter
        WHERE maintenance_user_filter.id = ${userIdColumn}
            AND LOWER(COALESCE(maintenance_user_filter.email, '')) IN (${sqlStringList(MAINTENANCE_USER_EMAILS)})
    ))`;
}

export function getPromoAnonymousMaintenanceFilter(request: Request, ipHashColumn = 'ip_hash'): string {
    if (shouldIncludeMaintenanceIp(request)) {
        return '(1 = 1)';
    }

    const excludedHashes = getExcludedMaintenanceIps().map((ipAddress) => hashPromoVisitorIp(ipAddress));
    return `(${ipHashColumn} IS NULL OR ${ipHashColumn} NOT IN (${sqlStringList(excludedHashes)}))`;
}
