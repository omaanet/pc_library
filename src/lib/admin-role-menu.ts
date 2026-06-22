const ROLE_MENU_CLASSES: Record<number, string> = {
    0: '',
    1: 'text-blue-700 focus:text-blue-700 dark:text-blue-300 dark:focus:text-blue-300',
    2: 'text-amber-700 focus:text-amber-700 dark:text-amber-300 dark:focus:text-amber-300',
    3: 'font-semibold text-yellow-600 focus:text-yellow-600 dark:text-yellow-400 dark:focus:text-yellow-400',
};

export function getAdminRoleMenuClass(level: number | null | undefined): string {
    return ROLE_MENU_CLASSES[level ?? 0] ?? ROLE_MENU_CLASSES[0];
}
