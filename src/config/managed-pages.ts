import { ADMIN_ROLES, type AdminRole } from './admin-roles';
export { getVisibleManagedPages, sortManagedPages } from '@/lib/managed-page-order';

export const MANAGED_PAGE_KEYS = [
    'guide',
    'settings',
    'books',
    'statistics',
    'animations',
    'migrations',
    'promo-pages',
    'users',
    'pages',
] as const;

export type ManagedPageKey = typeof MANAGED_PAGE_KEYS[number];

export interface ManagedPageDefinition {
    key: ManagedPageKey;
    label: string;
    href: string;
    defaultAccessLevel: AdminRole;
    defaultDisplayOrder: number;
    accessLevelLocked?: boolean;
    menuIcon?: 'settings' | 'circle-help';
}

export interface ManagedPageConfig extends ManagedPageDefinition {
    accessLevel: AdminRole;
    displayOrder: number;
}

export const MANAGED_PAGE_DEFINITIONS: readonly ManagedPageDefinition[] = [
    { key: 'settings', label: 'Impostazioni', href: '/settings', defaultAccessLevel: ADMIN_ROLES.REGISTERED, defaultDisplayOrder: 1, menuIcon: 'settings' },
    { key: 'guide', label: 'Guida', href: '/guida', defaultAccessLevel: ADMIN_ROLES.REGISTERED, defaultDisplayOrder: 2, menuIcon: 'circle-help' },
    { key: 'books', label: 'Gestisci Racconti', href: '/add-book?tab=manage', defaultAccessLevel: ADMIN_ROLES.ADMIN, defaultDisplayOrder: 1 },
    { key: 'statistics', label: 'Statistiche', href: '/user-statistics', defaultAccessLevel: ADMIN_ROLES.ADMIN, defaultDisplayOrder: 2 },
    { key: 'promo-pages', label: 'Pagine Promo', href: '/admin/promo-pages', defaultAccessLevel: ADMIN_ROLES.POWER_ADMIN, defaultDisplayOrder: 1 },
    { key: 'animations', label: 'Animazioni', href: '/animations-manager', defaultAccessLevel: ADMIN_ROLES.POWER_ADMIN, defaultDisplayOrder: 2 },
    { key: 'migrations', label: 'Migrazioni DB', href: '/admin/migrations', defaultAccessLevel: ADMIN_ROLES.POWER_ADMIN, defaultDisplayOrder: 3 },
    { key: 'users', label: 'Gestisci Utenti', href: '/admin/users', defaultAccessLevel: ADMIN_ROLES.SUPER_ADMIN, defaultDisplayOrder: 1 },
    { key: 'pages', label: 'Gestisci Pagine', href: '/admin/pages', defaultAccessLevel: ADMIN_ROLES.SUPER_ADMIN, defaultDisplayOrder: 2, accessLevelLocked: true },
] as const;

const DEFINITIONS_BY_KEY = new Map(MANAGED_PAGE_DEFINITIONS.map((page) => [page.key, page]));

export function isManagedPageKey(value: unknown): value is ManagedPageKey {
    return typeof value === 'string' && DEFINITIONS_BY_KEY.has(value as ManagedPageKey);
}

export function getManagedPageDefinition(key: ManagedPageKey): ManagedPageDefinition {
    return DEFINITIONS_BY_KEY.get(key)!;
}

export function getDefaultManagedPages(): ManagedPageConfig[] {
    return MANAGED_PAGE_DEFINITIONS.map((page) => ({
        ...page,
        accessLevel: page.defaultAccessLevel,
        displayOrder: page.defaultDisplayOrder,
    }));
}
