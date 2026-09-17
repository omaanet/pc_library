import { requireSuperAdmin, requireManagedPageAccess } from '@/lib/admin-auth';
import { analyticsConfig, getAnalyticsClient } from '@/lib/vercel-analytics/client';
import { checkSetup } from '@/lib/vercel-analytics/service';
import { analyticsRoute } from '@/lib/vercel-analytics/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
    return analyticsRoute(request, {
        authorize: async () => { await requireSuperAdmin(); await requireManagedPageAccess('statistics'); return { diagnostics: true }; },
        check: async () => { const config = analyticsConfig(); return checkSetup(getAnalyticsClient(config), config); },
    });
}
