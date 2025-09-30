// src/lib/db/client.ts
// Database connection management for Neon/Postgres
import { neon } from '@neondatabase/serverless';

// Neon connection string from environment variable
const connectionString = process.env.DATABASE_URL as string;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for Neon connection');
}

// Log database connection info (without exposing full credentials)
const dbUrl = new URL(connectionString);
console.log(`[Database] Connecting to: ${dbUrl.protocol}//${dbUrl.hostname}${dbUrl.port ? `:${dbUrl.port}` : ''}${dbUrl.pathname}`);

// Create a singleton Neon client (pool)
let neonClient: any = null;

/**
 * Get or create the singleton Neon database client
 * @returns The Neon client instance with query debugging wrapper
 */
export function getNeonClient(): any {
    if (!neonClient) {
        // Create the base Neon client
        neonClient = neon(connectionString);

        // Save the original query method
        const originalQuery = neonClient.query;

        // Override the query method with our debugging wrapper
        neonClient.query = async function (sql: string, params?: any[]) {
            // Log query info
            // console.debug('------ DATABASE QUERY -------');
            // console.debug('[Neon SQL] Query:', sql);
            // console.debug('[Neon SQL] Params:', params);

            try {
                // Call the original query method, preserving 'this' context
                const result = await originalQuery.call(this, sql, params);

                // Log result info
                // console.debug('[Neon SQL] Success! Rows:', result?.rows?.length || 0);
                if (result?.rows?.length > 0) {
                    // console.debug('[Neon SQL] First row:', JSON.stringify(result.rows[0]));
                }

                return result;
            } catch (error) {
                // Log error info
                console.error('[Neon SQL] Error executing query:', error);
                throw error;
            }
        };
    }

    return neonClient;
}
