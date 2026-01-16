// src/lib/db/utils.ts
// Query utility functions for handling Neon/Postgres results
import type { NeonQueryResult } from '@/types/database';

/**
 * Extract first row from query result
 * @param result - Query result from Neon client (array)
 * @returns First row or null if no rows found
 */
export function getFirstRow<T = unknown>(result: NeonQueryResult<T>): T | null {
    return (Array.isArray(result) ? result[0] : null) || null;
}

/**
 * Utility to extract rows from Neon/Postgres query results.
 * @param res - Query result from Neon client (array)
 * @returns Array of rows
 */
export function extractRows<T = unknown>(res: NeonQueryResult<T>): T[] {
    if (Array.isArray(res)) {
        return res as T[];
    }
    console.error('[extractRows] Unexpected query result:', res);
    return [];
}
