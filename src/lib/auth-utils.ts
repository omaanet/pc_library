// src/lib/auth-utils.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById } from './user-db';

type CookieStoreLike = {
    get?: (name: string) => { value?: string } | string | undefined;
    session?: string;
};

// Request type that supports both NextRequest (App Router) and request objects with cookies
type RequestWithCookies = NextRequest | { cookies: CookieStoreLike };

function getSessionCookieValue(req: RequestWithCookies): string | undefined {
    const cookieStore = req.cookies as CookieStoreLike | undefined;
    if (!cookieStore) return undefined;

    if (typeof cookieStore.get === 'function') {
        const sessionCookie = cookieStore.get('session');
        return typeof sessionCookie === 'string' ? sessionCookie : sessionCookie?.value;
    }

    return cookieStore.session;
}

async function getUserFromSessionCookie(sessionCookieValue: string | undefined) {
    try {
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

// Get the user from the session cookie
// Supports both NextRequest (App Router) and other request types with cookies
export async function getSessionUser(req: RequestWithCookies) {
    return getUserFromSessionCookie(getSessionCookieValue(req));
}

export async function getCurrentSessionUser() {
    const sessionCookieValue = (await cookies()).get('session')?.value;
    return getUserFromSessionCookie(sessionCookieValue);
}
