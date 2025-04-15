// src/lib/user-db.ts
import { getDb } from './db';
import { User } from '@/types';
import crypto from 'crypto';

/**
 * Check if a user with the given email exists
 * @returns user object with id and is_activated flag if exists, null otherwise
 */
export function userExists(email: string): { id: number; is_activated: number; verification_token: string } | null {
    const db = getDb();
    const user = db.prepare('SELECT id, is_activated, verification_token FROM users WHERE email = ?').get(email.toLowerCase()) as { id: number; is_activated: number; verification_token: string } | undefined;
    return user || null;
}

/**
 * Create a new user
 * Checks if an existing user is found with the same email:
 * - If not found, creates a new user
 * - If found and account is already activated, returns null
 * - If found but not activated, returns the existing verification token
 */
export function createUser(email: string, fullName: string): { userId: number, verificationToken: string } | null {
    const db = getDb();

    // Check if a user with the same email already exists
    const existingUser = userExists(email);

    if (existingUser) {
        // If user exists and is activated, halt the procedure
        if (existingUser.is_activated === 1) {
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
    const result = db.prepare(`
        INSERT INTO users (
        email,
        full_name,
        is_activated,
        verification_token
        ) VALUES (?, ?, ?, ?)
    `).run(
        email.toLowerCase(),
        fullName,
        0, // Not activated
        verificationToken
    );

    // Return the auto-generated userId and the verification token
    return { userId: result.lastInsertRowid as number, verificationToken };
}

/**
 * Find a user by verification token
 */
export function findUserByVerificationToken(token: string): { id: number, email: string, fullName: string } | null {
    const db = getDb();
    const user = db.prepare(`
        SELECT id, email, full_name as fullName
        FROM users
        WHERE verification_token = ?
    `).get(token) as { id: number, email: string, fullName: string } | undefined;

    return user || null;
}

/**
 * Activate a user account and set a password
 */
export function activateUser(userId: number, password: string): boolean {
    const db = getDb();

    // Hash the password for storage (in a real app, use a proper password hashing library)
    const passwordHash = crypto
        .createHash('sha256')
        .update(password + process.env.PASSWORD_SALT)
        .digest('hex');

    try {
        db.prepare(`
            UPDATE users
            SET 
                is_activated = 1,
                password_hash = ?,
                verification_token = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(passwordHash, userId);

        return true;
    } catch (error) {
        console.error('Error activating user:', error);
        return false;
    }
}

/**
 * Get a user by ID
 */
export function getUserById(id: number): User | null {
    const db = getDb();

    const user = db.prepare(`
        SELECT 
            id,
            email,
            full_name as fullName,
            is_activated as isActivated,
            created_at as createdAt,
            updated_at as updatedAt
        FROM users
        WHERE id = ?
    `).get(id) as {
        id: number,
        email: string,
        fullName: string,
        isActivated: number,
        createdAt: string,
        updatedAt?: string
    } | undefined;

    if (!user) return null;

    // For a real app, you would fetch user preferences and stats from related tables
    // For now, provide default values
    return {
        ...user,
        name: user.fullName.split(' ')[0], // First name as default name
        preferences: {
            theme: 'system' as const,
            language: 'en',
            fontSize: 16,
            viewMode: 'grid' as const,
            notifications: {
                email: true,
                push: true,
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
        isActivated: Boolean(user.isActivated),
        createdAt: new Date(user.createdAt),
        updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
    };
}

/**
 * Check user credentials for login
 */
export function validateUserCredentials(email: string, password: string): User | null {
    const db = getDb();

    // Hash the password for comparison
    const passwordHash = crypto
        .createHash('sha256')
        .update(password + process.env.PASSWORD_SALT)
        .digest('hex');

    const user = db.prepare(`
        SELECT id
        FROM users
        WHERE email = ? AND password_hash = ? AND is_activated = 1
    `).get(email.toLowerCase(), passwordHash) as { id: number } | undefined;

    if (!user) return null;

    return getUserById(user.id);
}

/**
 * Generate a random password
 */
export function generateRandomPassword(length = 12): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }

    return password;
}
