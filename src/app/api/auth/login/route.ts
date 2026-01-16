// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { authenticateUserByEmail } from '@/lib/user-db';
import { SESSION_DURATION } from '@/config/auth-config';
import { handleApiError, ApiError, HttpStatus } from '@/lib/api-error-handler';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        // Basic validation
        if (!email) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Email è richiesto');
        }

        // Authenticate user by email only (passwordless flow)
        const user = await authenticateUserByEmail(email);

        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Utente non trovato');
        }

        // Create session data (3 hours)
        const session = {
            userId: String(user.id),
            expires: new Date(Date.now() + SESSION_DURATION.AUTH * 1000).toISOString(),
        };

        // Create response with user data
        const response = NextResponse.json({
            user,
            message: 'Accesso effettuato con successo'
        });

        // Set session cookie (3 hours)
        const isSecure = process.env.NODE_ENV === 'production';
        response.headers.set(
            'Set-Cookie',
            `session=${Buffer.from(JSON.stringify(session)).toString('base64')}; Path=/; HttpOnly; SameSite=Strict; ${isSecure ? 'Secure;' : ''} Max-Age=${SESSION_DURATION.AUTH}`
        );

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return handleApiError(error, 'Accesso fallito', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
