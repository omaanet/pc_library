import { requireAdmin, requireManagedPageAccess } from '@/lib/admin-auth';
import { cachedDashboard } from '@/lib/vercel-analytics/cached-dashboard';
import { analyticsRoute } from '@/lib/vercel-analytics/route-handler';
import { isSuperAdminLevel } from '@/config/admin-roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 240;
export async function GET(request: Request) {
    return analyticsRoute(request, {
        authorize: async () => {
            const user = await requireAdmin();
            await requireManagedPageAccess('statistics');
            return { diagnostics: isSuperAdminLevel(user.userLevel) };
        },
        dashboard: cachedDashboard,
    });
}
