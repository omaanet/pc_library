import type { ReactNode } from 'react';
import { getAdminRole, type AdminRole } from '@/config/admin-roles';
import type { ManagedPageKey } from '@/config/managed-pages';
import { getCurrentSessionUser } from '@/lib/auth-utils';
import { getManagedPage } from '@/lib/db/queries/managed-pages';
import { ManagedPageAccessDenied } from '@/components/auth/managed-page-access-denied';

export async function ManagedPageGuard({
    pageKey,
    fixedAccessLevel,
    children,
}: {
    pageKey: ManagedPageKey;
    fixedAccessLevel?: AdminRole;
    children: ReactNode;
}) {
    const [user, page] = await Promise.all([
        getCurrentSessionUser(),
        fixedAccessLevel === undefined ? getManagedPage(pageKey) : Promise.resolve(null),
    ]);
    const requiredLevel = fixedAccessLevel ?? page!.accessLevel;
    const isAllowed = !!user && (user.userLevel ?? 0) >= requiredLevel;

    if (!isAllowed) {
        return <ManagedPageAccessDenied isAuthenticated={!!user} requiredRole={getAdminRole(requiredLevel).label} />;
    }
    return children;
}
