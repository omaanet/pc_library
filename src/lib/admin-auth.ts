// src/lib/admin-auth.ts
// Admin authorization middleware for API routes

import { cookies } from 'next/headers';
import { getUserById } from '@/lib/user-db';
import { User } from '@/types';
import { ApiError, HttpStatus } from '@/lib/api-error-handler';

/**
 * Require admin authentication for API routes
 *
 * Validates session cookie and checks admin role.
 *
 * @throws ApiError with status 401 if not authenticated
 * @throws ApiError with status 403 if authenticated but not admin
 * @returns User object if authenticated and admin
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   try {
 *     const user = await requireAdmin();
 *     // ... rest of handler
 *   } catch (error) {
 *     return handleApiError(error, 'Failed to create book');
 *   }
 * }
 * ```
 */
export async function requireAdmin(): Promise<User> {
    // Get session cookie
    const sessionCookie = (await cookies()).get('session');

    if (!sessionCookie) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
    }

    try {
        // Parse session cookie (base64-encoded JSON)
        const sessionData = JSON.parse(
            Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
        ) as { userId: number; expires: string };

        // Check if session has expired
        if (new Date(sessionData.expires) < new Date()) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Session expired');
        }

        // Get user from database
        const user = await getUserById(Number(sessionData.userId));

        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'User not found');
        }

        // Check admin role
        if (!user.isAdmin) {
            throw new ApiError(HttpStatus.FORBIDDEN, 'Admin access required');
        }

        return user;
    } catch (error) {
        // Re-throw if it's our ApiError
        if (error instanceof ApiError) {
            throw error;
        }

        // Any other error (parsing, etc.) is treated as unauthorized
        console.error('Error validating admin session:', error);
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid session');
    }
}
