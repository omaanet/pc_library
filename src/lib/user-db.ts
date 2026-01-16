// src/lib/user-db.ts
// Consolidated authentication functions for passwordless flow
import { getNeonClient, getFirstRow } from './db';
import { User } from '@/types';
import type { DatabaseUser, DATABASE_ERROR_CODES } from '@/types/database';
import { isUniqueViolationError } from '@/types/database';

/**
 * Check if a user with the given email exists
 * @returns user object with id and is_activated flag if exists, null otherwise
 */
export async function userExists(email: string): Promise<{ id: number; is_activated: boolean; verification_token: string | null } | null> {
    const client = getNeonClient();
    const res = await client.query<Pick<DatabaseUser, 'id' | 'is_activated' | 'verification_token'>>(
        'SELECT id, is_activated, verification_token FROM users WHERE email = $1',
        [email.toLowerCase()]
    );
    return getFirstRow(res);
}

/**
 * Create a new user with passwordless flow (auto-activated)
 * Uses atomic INSERT with ON CONFLICT to prevent race conditions
 */
export async function createUser(email: string, fullName: string): Promise<{ userId: number } | null> {
    const client = getNeonClient();

    try {
        // Use INSERT with ON CONFLICT to handle race conditions atomically
        const insertRes = await client.query<Pick<DatabaseUser, 'id'>>(
            `INSERT INTO users (email, full_name, is_activated, verification_token, password_hash) 
             VALUES ($1, $2, true, NULL, NULL) 
             ON CONFLICT (email) DO NOTHING 
             RETURNING id`,
            [email.toLowerCase(), fullName]
        );

        const userId = getFirstRow(insertRes)?.id;
        if (!userId) {
            // If no ID returned, it means the user already exists (conflict)
            return null;
        }

        return { userId };
    } catch (error: unknown) {
        // Handle database errors
        if (isUniqueViolationError(error)) {
            // Email already exists
            return null;
        }

        // Log unexpected errors
        console.error('Error creating user:', error);
        throw error;
    }
}

/**
 * Authenticate a user with just email (passwordless flow)
 * This is used for passwordless login
 */
export async function authenticateUserByEmail(email: string): Promise<User | null> {
    const client = getNeonClient();

    // Find active user by email
    const result = await client.query<Pick<DatabaseUser, 'id'>>(
        `SELECT id FROM users WHERE email = $1 AND is_activated = true LIMIT 1`,
        [email.toLowerCase()]
    );

    const row = getFirstRow(result);
    const userId = row?.id;
    if (!userId) return null;

    // Get full user object
    const user = await getUserById(userId);
    return user;
}

/**
 * Get a user by ID
 */
export async function getUserById(id: number): Promise<User | null> {
    const client = getNeonClient();
    const res = await client.query<
        Pick<DatabaseUser, 'id' | 'email' | 'full_name' | 'is_activated' | 'is_admin' | 'created_at' | 'updated_at'>
    >(
        `SELECT id, email, full_name, is_activated as "isActivated", is_admin, created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE id = $1`,
        [id]
    );

    const user = getFirstRow(res);
    if (!user) return null;

    // For a real app, you would fetch user preferences and stats from related tables
    // For now, provide default values
    
    return {
        ...user,
        fullName: user.full_name, // Map from DB field to app field
        userLevel: user.is_admin, // Use is_admin column directly as userLevel
        isAdmin: Boolean(user.is_admin > 0), // Map from DB field to app field
        name: user.full_name?.split(' ')?.[0] || user.full_name || 'Utente', // First name, or full name, or fallback
        preferences: {
            theme: 'system' as const,
            language: 'it',
            fontSize: 16,
            viewMode: 'grid' as const,
            notifications: {
                email: false,
                push: false,
                SMS: false,
            },
            accessibility: {
                largeText: false,
                reduceAnimations: false,
                highContrast: false,
                reducedMotion: false,
            },
            emailNotifications: {},
            reading: {},
        },
        stats: {
            totalBooksRead: 0,
            totalReadingTime: 0,
            totalAudioTime: 0,
            completedBooks: 0,
            readingStreak: 0,
            lastReadDate: new Date().toISOString(),
        },
        isActivated: user.is_activated, // Map from DB field to app field
        createdAt: user.created_at ? new Date(user.created_at) : undefined,
        updatedAt: user.updated_at ? new Date(user.updated_at) : undefined,
    };
}

