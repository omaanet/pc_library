// src/lib/auth-utils.ts
import { NextRequest } from 'next/server';
import { getUserById } from './user-db';

// Request type that supports both NextRequest (App Router) and request objects with cookies
type RequestWithCookies = NextRequest | { cookies: { session?: string } };

// Get the user from the session cookie
// Supports both NextRequest (App Router) and other request types with cookies
export async function getSessionUser(req: RequestWithCookies) {
    try {
        let sessionCookieValue: string | undefined = undefined;

        // App Router: NextRequest (has cookies as RequestCookies with get method)
        if (req instanceof NextRequest) {
            sessionCookieValue = req.cookies.get('session')?.value;
        } else if (req.cookies) {
            // Other request types with plain cookies object
            sessionCookieValue = req.cookies.session;
        }
        
        if (!sessionCookieValue) return null;
        
        // Parse the session cookie
        const sessionData = JSON.parse(
            Buffer.from(sessionCookieValue, 'base64').toString('utf-8')
        ) as { userId: number; expires: string };
        
        // Check if session has expired
        if (new Date(sessionData.expires) < new Date()) {
            return null;
        }
        
        // Get user from database
        const user = await getUserById(Number(sessionData.userId));
        if (!user) return null;

        return {
            ...user,
            isAdmin: !!user.isAdmin
        };

    } catch (error) {
        console.error('Error parsing session:', error);
        return null;
    }
}
