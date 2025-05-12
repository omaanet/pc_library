// src/lib/user-db-simple.ts
import { getNeonClient, getFirstRow } from './db';
import { User } from '@/types';

/**
 * Simplified user database functions for the new authentication flow
 * These functions implement the simplified auth flow which doesn't require:
 * - Email verification
 * - Password generation
 * - Account activation process
 */

/**
 * Create a new user with simplified flow (auto-activated)
 * Verifies email uniqueness and creates an activated user without password
 */
export async function createUserSimple(email: string, fullName: string): Promise<{ userId: number } | null> {
    const client = getNeonClient();

    // Check if a user with the same email already exists
    const existingUser = await userExists(email);
    if (existingUser) {
        return null;
    }

    // Store the user in the database with isActivated=true
    // No verification token, no password
    const insertRes = await client.query(
        `INSERT INTO users (email, full_name, is_activated, verification_token, password_hash) 
         VALUES ($1, $2, true, NULL, NULL) RETURNING id`,
        [email.toLowerCase(), fullName]
    );
    
    const userId = insertRes[0]?.id;
    if (!userId) return null;
    
    return { userId };
}

/**
 * Check if a user with the given email exists
 * Reusing the existing function from user-db.ts
 */
export async function userExists(email: string): Promise<{ id: number; is_activated: boolean; verification_token: string } | null> {
    const client = getNeonClient();
    const res = await client.query('SELECT id, is_activated, verification_token FROM users WHERE email = $1', [email.toLowerCase()]);
    return getFirstRow(res);
}

/**
 * Authenticate a user with just email (simplified flow)
 * This is used for passwordless login in the new auth flow
 */
export async function authenticateUserByEmail(email: string): Promise<User | null> {
    const client = getNeonClient();
    
    // Find active user by email
    const result = await client.query(
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
 * Get a user by ID (reused from the original authentication flow)
 */
export async function getUserById(id: number): Promise<User | null> {
    const client = getNeonClient();
    const res = await client.query(
        `SELECT id, email, full_name as "fullName", is_activated as "isActivated", is_admin as "isAdmin", 
         created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE id = $1`,
        [id]
    );

    const user = getFirstRow(res);
    if (!user) return null;

    // For a real app, you would fetch user preferences and stats from related tables
    // For now, provide default values
    return {
        ...user,
        isAdmin: Boolean(user.isAdmin),
        name: user.fullName.split(' ')[0], // First name as default name
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
        isActivated: user.isActivated,
        createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
        updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
    };
}
