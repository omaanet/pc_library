export type OrderableManagedPage = {
    accessLevel: number;
    displayOrder: number;
    label: string;
};

export function sortManagedPages<T extends OrderableManagedPage>(pages: readonly T[]): T[] {
    return [...pages].sort((a, b) =>
        a.accessLevel - b.accessLevel
        || a.displayOrder - b.displayOrder
        || a.label.localeCompare(b.label, 'it')
    );
}

export function getVisibleManagedPages<T extends OrderableManagedPage>(pages: readonly T[], userLevel: number): T[] {
    return sortManagedPages(pages.filter((page) => userLevel >= page.accessLevel));
}
