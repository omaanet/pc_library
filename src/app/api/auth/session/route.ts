// src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById } from '@/lib/user-db';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (!sessionCookie?.value) {
            // No session cookie found
            return NextResponse.json({ user: null });
        }

        try {
            // Parse the session cookie
            const sessionData = JSON.parse(
                Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
            ) as { userId: string; expires: string };

            // Check if session has expired
            if (new Date(sessionData.expires) < new Date()) {
                // Session expired, return no user
                return NextResponse.json({ user: null });
            }

            // Get user from database - convert string userId to number
            const user = getUserById(parseInt(sessionData.userId, 10));

            if (!user) {
                // User not found or no longer valid
                return NextResponse.json({ user: null });
            }

            // Return the user (excluding sensitive information)
            return NextResponse.json({
                user: {
                    id: user.id,
                    name: user.name,
                    fullName: user.fullName,
                    email: user.email,
                    preferences: user.preferences,
                    isActivated: user.isActivated,
                    stats: user.stats,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            });
        } catch (parseError) {
            console.error('Session parsing error:', parseError);
            // Invalid session format
            return NextResponse.json({ user: null });
        }
    } catch (error) {
        console.error('Session error:', error);
        return NextResponse.json(
            { error: 'Failed to get session' },
            { status: 500 }
        );
    }
}