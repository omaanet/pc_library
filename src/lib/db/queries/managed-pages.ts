import { isAdminRole, type AdminRole } from '@/config/admin-roles';
import {
    getDefaultManagedPages,
    getManagedPageDefinition,
    isManagedPageKey,
    MANAGED_PAGE_KEYS,
    sortManagedPages,
    type ManagedPageConfig,
    type ManagedPageKey,
} from '@/config/managed-pages';
import { getNeonClient } from '@/lib/db/client';
import { extractRows } from '@/lib/db/utils';
import { isMissingTableOrColumnError } from '@/types/database';

type ManagedPageRow = {
    pageKey: string;
    accessLevel: number;
    displayOrder: number;
};

export type ManagedPageUpdate = {
    key: ManagedPageKey;
    accessLevel: AdminRole;
    displayOrder: number;
};

function mergeRows(rows: ManagedPageRow[]): ManagedPageConfig[] {
    const byKey = new Map(rows.map((row) => [row.pageKey, row]));
    return sortManagedPages(getDefaultManagedPages().map((page) => {
        const row = byKey.get(page.key);
        if (!row || !isAdminRole(row.accessLevel) || !Number.isInteger(row.displayOrder) || row.displayOrder < 1) {
            return page;
        }
        return { ...page, accessLevel: row.accessLevel, displayOrder: row.displayOrder };
    }));
}

export async function getManagedPages(): Promise<ManagedPageConfig[]> {
    try {
        const rows = extractRows<ManagedPageRow>(await getNeonClient().query(
            `SELECT page_key AS "pageKey", access_level AS "accessLevel", display_order AS "displayOrder"
             FROM managed_pages`
        ));
        return mergeRows(rows);
    } catch (error) {
        if (isMissingTableOrColumnError(error)) return getDefaultManagedPages();
        throw error;
    }
}

export async function getManagedPage(key: ManagedPageKey): Promise<ManagedPageConfig> {
    const pages = await getManagedPages();
    return pages.find((page) => page.key === key)!;
}

export function validateManagedPageUpdates(value: unknown): ManagedPageUpdate[] | null {
    if (!Array.isArray(value) || value.length !== MANAGED_PAGE_KEYS.length) return null;
    const seen = new Set<string>();
    const updates: ManagedPageUpdate[] = [];

    for (const item of value) {
        if (!item || typeof item !== 'object') return null;
        const candidate = item as Record<string, unknown>;
        if (!isManagedPageKey(candidate.key) || seen.has(candidate.key)) return null;
        if (!isAdminRole(candidate.accessLevel)) return null;
        if (!Number.isInteger(candidate.displayOrder) || (candidate.displayOrder as number) < 1) return null;
        const definition = getManagedPageDefinition(candidate.key);
        if (definition.accessLevelLocked && candidate.accessLevel !== definition.defaultAccessLevel) return null;
        seen.add(candidate.key);
        updates.push({
            key: candidate.key,
            accessLevel: candidate.accessLevel,
            displayOrder: candidate.displayOrder as number,
        });
    }

    for (const level of [0, 1, 2, 3]) {
        const orders = updates.filter((item) => item.accessLevel === level).map((item) => item.displayOrder).sort((a, b) => a - b);
        if (orders.some((order, index) => order !== index + 1)) return null;
    }
    return updates;
}

export async function updateManagedPages(updates: ManagedPageUpdate[]): Promise<ManagedPageConfig[]> {
    const payload = JSON.stringify(updates.map((item) => ({
        page_key: item.key,
        access_level: item.accessLevel,
        display_order: item.displayOrder,
    })));

    await getNeonClient().query(
        `WITH input AS (
            SELECT * FROM jsonb_to_recordset($1::jsonb)
                AS x(page_key TEXT, access_level INTEGER, display_order INTEGER)
         )
         INSERT INTO managed_pages (page_key, access_level, display_order, updated_at)
         SELECT page_key, access_level, display_order, CURRENT_TIMESTAMP FROM input
         ON CONFLICT (page_key) DO UPDATE SET
            access_level = EXCLUDED.access_level,
            display_order = EXCLUDED.display_order,
            updated_at = CURRENT_TIMESTAMP`,
        [payload]
    );
    return getManagedPages();
}
