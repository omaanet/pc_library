// src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById } from '@/lib/user-db';
import { handleApiError, HttpStatus } from '@/lib/api-error-handler';
import type { User } from '@/types';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (!sessionCookie?.value) {
            // No session cookie found
            return createSessionResponse(null);
        }

        let sessionData: { userId: string; expires: string };
        try {
            sessionData = JSON.parse(
                Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
            ) as { userId: string; expires: string };
        } catch (parseError) {
            console.error('Session parsing error:', parseError);
            return createSessionResponse(null);
        }

        const userId = Number(sessionData.userId);
        const expiresAt = new Date(sessionData.expires);
        if (!Number.isInteger(userId) || userId <= 0 || Number.isNaN(expiresAt.getTime()) || expiresAt < new Date()) {
            return createSessionResponse(null);
        }

        // Keep this lookup outside the parsing block so transient database errors
        // return a server error instead of incorrectly logging out the client.
        const user = await getUserById(userId);
        if (!user) {
            return createSessionResponse(null);
        }

        const publicUser: User = {
            id: user.id,
            name: user.name,
            fullName: user.fullName,
            email: user.email,
            preferences: user.preferences,
            isActivated: user.isActivated,
            stats: user.stats,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            isAdmin: user.isAdmin,
            userLevel: user.userLevel,
        };
        return createSessionResponse(publicUser);
    } catch (error) {
        console.error('Session error:', error);
        const response = handleApiError(error, 'Failed to get session', HttpStatus.INTERNAL_SERVER_ERROR);
        response.headers.set('Cache-Control', 'private, no-store');
        return response;
    }
}

function createSessionResponse(user: User | null) {
    return NextResponse.json({ user }, { headers: { 'Cache-Control': 'private, no-store' } });
}
