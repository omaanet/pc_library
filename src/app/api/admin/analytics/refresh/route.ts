import { NextRequest } from 'next/server';
import { requireSuperAdmin, requireManagedPageAccess } from '@/lib/admin-auth';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { cachedDashboard } from '@/lib/vercel-analytics/cached-dashboard';
import { analyticsRoute } from '@/lib/vercel-analytics/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Stay within the Hobby limit when Fluid compute is disabled.
export const maxDuration = 60;
const refresh = withCSRFProtection(async (request: NextRequest) => analyticsRoute(request, {
    authorize: async () => { await requireSuperAdmin(); await requireManagedPageAccess('statistics'); return { diagnostics: true }; },
    dashboard: (period, limit) => cachedDashboard(period, limit, true),
}));
export async function POST(request: NextRequest) {
    const response = await refresh(request);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
}
