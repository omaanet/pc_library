// src/lib/db/client.ts
// Database connection management for Neon/Postgres
import { neon } from '@neondatabase/serverless';
import type { NeonClient, NeonQueryResult } from '@/types/database';

// Neon connection string from environment variable
const connectionString = process.env.DATABASE_URL as string;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for Neon connection');
}

// Log database connection info (without exposing full credentials)
const dbUrl = new URL(connectionString);
const isUsingPooler = dbUrl.hostname.includes('-pooler');

// In src/lib/db/client.ts, line 13
if (process.env.NODE_ENV === 'development') {
    console.log(`[Database] Connecting to: ${dbUrl.protocol}//${dbUrl.hostname}${dbUrl.port ? `:${dbUrl.port}` : ''}${dbUrl.pathname}`);
    console.log(`[Database] Connection pooling: ${isUsingPooler ? 'ENABLED (using -pooler endpoint)' : 'DISABLED'}`);
}

// Create a singleton Neon client
let neonClient: NeonClient | null = null;

/**
 * Get or create the singleton Neon database client
 * @returns The Neon client instance with optional debugging wrapper
 */
export function getNeonClient(): NeonClient {
    if (!neonClient) {
        // Create the base Neon client
        const baseClient = neon(connectionString);

        // Only apply debugging wrapper in development
        if (process.env.NODE_ENV === 'development') {
            // Save the original query method
            const originalQuery = baseClient.query;

            // Override the query method with our debugging wrapper
            const wrappedQuery = async function <T = any>(this: any, sql: string, params?: any[]): Promise<NeonQueryResult<T>> {
                // Log query info
                // console.debug('------ DATABASE QUERY -------');
                // console.debug('[Neon SQL] Query:', sql);
                // console.debug('[Neon SQL] Params:', params);

                try {
                    // Call the original query method, preserving 'this' context
                    const result = await originalQuery.call(this, sql, params);

                    // Log result info
                    // console.debug('[Neon SQL] Success! Rows:', result?.length || 0);
                    if (result && Array.isArray(result) && result.length > 0) {
                        // console.debug('[Neon SQL] First row:', JSON.stringify(result[0]));
                    }

                    return result as NeonQueryResult<T>;
                } catch (error) {
                    // Log error info
                    console.error('[Neon SQL] Error executing query:', error);
                    throw error;
                }
            };

            // Create typed client wrapper
            neonClient = {
                query: wrappedQuery,
            } as NeonClient;
        } else {
            // Create typed client wrapper without debugging
            neonClient = {
                query: baseClient.query,
            } as NeonClient;
        }
    }

    return neonClient;
}
