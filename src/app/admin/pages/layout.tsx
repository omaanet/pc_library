import { ADMIN_ROLES } from '@/config/admin-roles';
import { ManagedPageGuard } from '@/components/auth/managed-page-guard';
export default function Layout({ children }: { children: React.ReactNode }) {
    return <ManagedPageGuard pageKey="pages" fixedAccessLevel={ADMIN_ROLES.SUPER_ADMIN}>{children}</ManagedPageGuard>;
}
