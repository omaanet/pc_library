export const ADMIN_ROLES = {
    REGISTERED: 0,
    ADMIN: 1,
    POWER_ADMIN: 2,
    SUPER_ADMIN: 3,
} as const;

export type AdminRole = typeof ADMIN_ROLES[keyof typeof ADMIN_ROLES];
export type AdminRoleIconName = 'user' | 'shield' | 'shield-check' | 'crown';

export const ADMIN_ROLE_OPTIONS: ReadonlyArray<{
    value: AdminRole;
    label: string;
    icon: AdminRoleIconName;
}> = [
    { value: ADMIN_ROLES.REGISTERED, label: 'Utente registrato', icon: 'user' },
    { value: ADMIN_ROLES.ADMIN, label: 'Admin', icon: 'shield' },
    { value: ADMIN_ROLES.POWER_ADMIN, label: 'Power Admin', icon: 'shield-check' },
    { value: ADMIN_ROLES.SUPER_ADMIN, label: 'Super Admin', icon: 'crown' },
];

export function isAdminRole(value: unknown): value is AdminRole {
    return typeof value === 'number'
        && Number.isInteger(value)
        && value >= ADMIN_ROLES.REGISTERED
        && value <= ADMIN_ROLES.SUPER_ADMIN;
}

export function normalizeAdminRole(value: number | null | undefined): AdminRole {
    if ((value ?? 0) >= ADMIN_ROLES.SUPER_ADMIN) return ADMIN_ROLES.SUPER_ADMIN;
    if (value === ADMIN_ROLES.POWER_ADMIN) return ADMIN_ROLES.POWER_ADMIN;
    if (value === ADMIN_ROLES.ADMIN) return ADMIN_ROLES.ADMIN;
    return ADMIN_ROLES.REGISTERED;
}

export function isAdminLevel(value: number | null | undefined): boolean {
    return (value ?? ADMIN_ROLES.REGISTERED) >= ADMIN_ROLES.ADMIN;
}

export function isPowerAdminLevel(value: number | null | undefined): boolean {
    return (value ?? ADMIN_ROLES.REGISTERED) >= ADMIN_ROLES.POWER_ADMIN;
}

export function isSuperAdminLevel(value: number | null | undefined): boolean {
    return (value ?? ADMIN_ROLES.REGISTERED) >= ADMIN_ROLES.SUPER_ADMIN;
}

export function getAdminRole(value: number | null | undefined) {
    return ADMIN_ROLE_OPTIONS.find((role) => role.value === value) ?? ADMIN_ROLE_OPTIONS[0];
}
