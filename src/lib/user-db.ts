// src/lib/user-db.ts
import { getNeonClient, getFirstRow } from './db';
import { User } from '@/types';
import crypto from 'crypto';

/**
 * Check if a user with the given email exists
 * @returns user object with id and is_activated flag if exists, null otherwise
 */
export async function userExists(email: string): Promise<{ id: number; is_activated: boolean; verification_token: string } | null> {
    const client = getNeonClient();
    const res = await client.query('SELECT id, is_activated, verification_token FROM users WHERE email = $1', [email.toLowerCase()]);
    return getFirstRow(res);
}

/**
 * Create a new user
 * Checks if an existing user is found with the same email:
 * - If not found, creates a new user
 * - If found and account is already activated, returns null
 * - If found but not activated, returns the existing verification token
 */
export async function createUser(email: string, fullName: string): Promise<{ userId: number, verificationToken: string } | null> {
    const client = getNeonClient();

    // Check if a user with the same email already exists
    const existingUser = await userExists(email);

    if (existingUser) {
        // If user exists and is activated, halt the procedure
        if (existingUser.is_activated === true) {
            return null;
        }
        // If user exists but is not activated, return the existing verification token
        return {
            userId: existingUser.id,
            verificationToken: existingUser.verification_token
        };
    }

    // Generate a new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Store the user in the database with the verification token
    const insertRes = await client.query(
        `INSERT INTO users (email, full_name, is_activated, verification_token) VALUES ($1, $2, $3, $4) RETURNING id`,
        [email.toLowerCase(), fullName, 0, verificationToken]
    );
    // const userId = insertRes.rows[0]?.id;
    const userId = insertRes[0]?.id;
    if (!userId) return null;
    return { userId, verificationToken };
}

/**
 * Find a user by verification token
 */
export async function findUserByVerificationToken(token: string): Promise<{ id: number, email: string, fullName: string } | null> {
    const client = getNeonClient();
    const res = await client.query(
        `SELECT id, email, full_name as "fullName" FROM users WHERE verification_token = $1`,
        [token]
    );
    return getFirstRow(res);
}

/**
 * Activate a user account and set a password
 */
export async function activateUser(userId: number, password: string): Promise<boolean> {
    const client = getNeonClient();
    // Hash the password for storage (in a real app, use a proper password hashing library)
    const passwordHash = crypto
        .createHash('sha256')
        .update(password + process.env.PASSWORD_SALT)
        .digest('hex');
    try {
        await client.query(
            `UPDATE users SET is_activated = true, password_hash = $1, verification_token = NULL, updated_at = NOW() WHERE id = $2`,
            [passwordHash, userId]
        );
        return true;
    } catch (error) {
        console.error('Error activating user:', error);
        return false;
    }
}

/**
 * Get a user by ID
 */
export async function getUserById(id: number): Promise<User | null> {
    const client = getNeonClient();
    const res = await client.query(
        `SELECT id, email, full_name as "fullName", is_activated as "isActivated", is_admin as "isAdmin", created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE id = $1`,
        [id]
    );

    const user = getFirstRow(res);;
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

/**
 * Check user credentials for login
 */
export async function validateUserCredentials(email: string, password: string): Promise<User | null> {
    const client = getNeonClient();
    // Hash the password for comparison
    const passwordHash = crypto
        .createHash('sha256')
        .update(password + process.env.PASSWORD_SALT)
        .digest('hex');

    const result = await client.query(
        `SELECT id FROM users WHERE email = $1 AND password_hash = $2 AND is_activated = $3 LIMIT 1`,
        [email.toLowerCase(), passwordHash, true]
    );

    const row = getFirstRow(result);
    const userId = row?.id;
    if (!userId) return null;

    const user = await getUserById(userId);
    return user;
}
