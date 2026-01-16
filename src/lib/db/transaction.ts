// Database transaction utilities for Neon/Postgres
import { getNeonClient } from './client';
import type { NeonClient, NeonQueryResult, DatabaseTransaction, QueryParams } from '@/types/database';

/**
 * Begin a database transaction
 * @returns Transaction object with query, commit, and rollback methods
 */
export async function beginTransaction(): Promise<DatabaseTransaction> {
    const client = getNeonClient();
    
    // Begin transaction
    await client.query('BEGIN');
    
    let isActive = true;
    
    return {
        async query<T = unknown>(sql: string, params?: QueryParams): Promise<NeonQueryResult<T>> {
            if (!isActive) {
                throw new Error('Transaction is not active');
            }
            return client.query<T>(sql, params);
        },
        
        async rollback(): Promise<void> {
            if (!isActive) return;
            await client.query('ROLLBACK');
            isActive = false;
        },
        
        async commit(): Promise<void> {
            if (!isActive) return;
            await client.query('COMMIT');
            isActive = false;
        }
    };
}

/**
 * Execute a function within a transaction
 * Automatically commits on success or rolls back on error
 * @param fn - Function to execute within transaction
 * @returns Result of the function
 */
export async function withTransaction<T>(
    fn: (tx: DatabaseTransaction) => Promise<T>
): Promise<T> {
    const tx = await beginTransaction();
    
    try {
        const result = await fn(tx);
        await tx.commit();
        return result;
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

/**
 * Helper for executing multiple queries in a transaction
 * @param queries - Array of query tuples [sql, params]
 * @returns Array of query results
 */
export async function executeTransactionQueries<T = unknown>(
    queries: Array<[string, QueryParams?]>
): Promise<NeonQueryResult<T>[]> {
    return withTransaction(async (tx) => {
        const results: NeonQueryResult<T>[] = [];
        
        for (const [sql, params] of queries) {
            const result = await tx.query<T>(sql, params);
            results.push(result);
        }
        
        return results;
    });
}
