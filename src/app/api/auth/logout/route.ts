// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // Create response for successful logout
        const response = NextResponse.json({
            success: true,
            message: 'Logout successful'
        });

        // Clear session cookie by setting expiry in the past
        response.headers.set(
            'Set-Cookie',
            'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
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