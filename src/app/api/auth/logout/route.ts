// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // Create response and clear cookie
        const response = NextResponse.json({
            success: true,
            message: 'Logout successful'
        });

        // Clear cookie
        response.headers.set('Set-Cookie',
            'session-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
        );

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
        );
    }
}