// src/lib/db/utils.ts
// Query utility functions for handling Neon/Postgres results
import type { NeonQueryResult } from '@/types/database';

/**
 * Extract first row from query result (handles both array and object formats)
 * @param result - Query result from Neon client
 * @returns First row or null if no rows found
 */
export function getFirstRow<T = unknown>(result: NeonQueryResult<T> | T[]): T | null {
    return (Array.isArray(result) ? result[0] : result?.rows?.[0]) || null;
}

/**
 * Utility to robustly extract rows from Neon/Postgres query results.
 * Handles both array and { rows: [...] } result shapes.
 * @param res - Query result from Neon client
 * @returns Array of rows
 */
export function extractRows<T = unknown>(res: NeonQueryResult<T> | T[]): T[] {
    if (Array.isArray(res)) {
        return res as T[];
    }
    if (res && Array.isArray((res as NeonQueryResult<T>).rows)) {
        return (res as NeonQueryResult<T>).rows as T[];
    }
    console.error('[extractRows] Unexpected query result:', res);
    return [];
}
