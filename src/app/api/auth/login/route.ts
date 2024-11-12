// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { mockUser } from '@/lib/mock/data';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Simulate basic validation
        if (!body.email || !body.password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Simulate successful login
        await new Promise(resolve => setTimeout(resolve, 800));

        // Create response with user data and set cookie
        const response = NextResponse.json({
            user: mockUser,
            message: 'Login successful'
        });

        // Set cookie
        response.headers.set('Set-Cookie',
            `session-token=mock-session-token; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
        );

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        );
    }
}