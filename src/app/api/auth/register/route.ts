// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { createUser } from '@/lib/user-db';
import { SESSION_DURATION } from '@/config/auth-config';
import { handleApiError, ApiError, HttpStatus } from '@/lib/api-error-handler';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, fullName } = body;

        // Validate required fields
        if (!email || !fullName) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Email e nome completo sono richiesti');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Formato email non valido');
        }

        // Create a new user with passwordless flow (already activated)
        // The createUser function now handles race conditions atomically
        const createResult = await createUser(email, fullName);
        if (!createResult) {
            throw new ApiError(HttpStatus.CONFLICT, 'Un utente con questa email esiste già');
        }
        
        // Create session data (3 hours)
        const session = {
            userId: String(createResult.userId),
            expires: new Date(Date.now() + SESSION_DURATION.AUTH * 1000).toISOString(), // 3 hours
        };

        // Create response with success message
        const response = NextResponse.json({
            success: true,
            message: 'Registrazione effettuata con successo! Sarai reindirizzato alla home page.',
            redirectAfterSeconds: 3,
        });

        // Set session cookie
        const isSecure = process.env.NODE_ENV === 'production';
        response.headers.set(
            'Set-Cookie',
            `session=${Buffer.from(JSON.stringify(session)).toString('base64')}; Path=/; HttpOnly; SameSite=Strict; ${isSecure ? 'Secure;' : ''} Max-Age=${SESSION_DURATION.AUTH}`
        );

        return response;
    } catch (error) {
        console.error('Registration error:', error);
        return handleApiError(error, 'Si è verificato un errore imprevisto. Riprova più tardi.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

