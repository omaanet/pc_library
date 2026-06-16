import { SITE_CONFIG } from '@/config/site-config';

export function shouldIncludeMaintenanceIp(request: Request): boolean {
    const { searchParams } = new URL(request.url);
    return searchParams.get('includeMaintenanceIp') !== 'false';
}

export function getMaintenanceIpFilter(request: Request, columnName = 'ip_address'): string {
    if (shouldIncludeMaintenanceIp(request)) {
        return '(1 = 1)';
    }

    return `(COALESCE(${columnName}, '') <> '${SITE_CONFIG.STATISTICS_MAINTENANCE_IP}')`;
}
