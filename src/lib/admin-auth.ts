// src/lib/admin-auth.ts
// Admin authorization middleware for API routes

import { cookies } from 'next/headers';
import { getUserById } from '@/lib/user-db';
import { User } from '@/types';
import { ApiError, HttpStatus } from '@/lib/api-error-handler';
import { isPowerAdminLevel, isSuperAdminLevel } from '@/config/admin-roles';
import { getManagedPage } from '@/lib/db/queries/managed-pages';
import type { ManagedPageKey } from '@/config/managed-pages';

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
export async function requireAuthenticatedUser(): Promise<User> {
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

export async function requireAdmin(): Promise<User> {
    const user = await requireAuthenticatedUser();
    if (!user.isAdmin) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Admin access required');
    }
    return user;
}

export async function requireManagedPageAccess(key: ManagedPageKey): Promise<User> {
    const user = await requireAuthenticatedUser();
    const page = await getManagedPage(key);
    if ((user.userLevel ?? 0) < page.accessLevel) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Page access required');
    }
    return user;
}

/**
 * Require elevated admin authentication for sensitive admin-only tools.
 *
 * Uses the same power-admin rule as the client-only admin surfaces:
 * authenticated admin user with userLevel greater than 1.
 */
export async function requirePowerAdmin(): Promise<User> {
    const user = await requireAdmin();

    if (!isPowerAdminLevel(user.userLevel)) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Power admin access required');
    }

    return user;
}

/** Require the highest administrative level for user and role management. */
export async function requireSuperAdmin(): Promise<User> {
    const user = await requireAdmin();

    if (!isSuperAdminLevel(user.userLevel)) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Super admin access required');
    }

    return user;
}
