// src/lib/auth-utils.ts
import { NextApiRequest } from 'next';
import { getUserById } from './user-db';

// Get the user from the session cookie
// Supports both NextApiRequest (Pages Router) and NextRequest (App Router)
export async function getSessionUser(req: any) {
    try {
        let sessionCookieValue: string | undefined = undefined;
        
        // App Router: NextRequest (has cookies.get)
        if (typeof req.cookies?.get === 'function') {
            sessionCookieValue = req.cookies.get('session')?.value;
        } else if (req.cookies) {
            // Pages Router or other request types
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
