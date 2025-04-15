// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { validateUserCredentials } from '@/lib/user-db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Basic validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Validate user credentials against database
        const user = validateUserCredentials(email, password);
        
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Create session data
        const session = {
            userId: user.id,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        };

        // Create response with user data
        const response = NextResponse.json({
            user,
            message: 'Login successful'
        });

        // Set session cookie
        response.headers.set(
            'Set-Cookie',
            `session=${Buffer.from(JSON.stringify(session)).toString('base64')}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
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