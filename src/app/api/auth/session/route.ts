// src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { mockUser } from '@/lib/mock/data';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('session-token');

        // For testing: if there's a session token, return mock user
        // In production, you would validate the session token
        if (sessionToken) {
            return NextResponse.json({ user: mockUser });
        }

        // No session found
        return NextResponse.json({ user: null });
    } catch (error) {
        console.error('Session error:', error);
        return NextResponse.json(
            { error: 'Failed to get session' },
            { status: 500 }
        );
    }
}