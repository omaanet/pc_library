import { Crown, Shield, ShieldCheck, User, type LucideProps } from 'lucide-react';
import { getAdminRole, type AdminRoleIconName } from '@/config/admin-roles';

const ROLE_ICONS: Record<AdminRoleIconName, React.ComponentType<LucideProps>> = {
    user: User,
    shield: Shield,
    'shield-check': ShieldCheck,
    crown: Crown,
};

export function AdminRoleIcon({
    level,
    ...props
}: LucideProps & { level: number | null | undefined }) {
    const Icon = ROLE_ICONS[getAdminRole(level).icon];
    return <Icon aria-hidden="true" {...props} />;
}
