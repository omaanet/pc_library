// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { validateUserCredentials } from '@/lib/user-db';
import { authenticateUserByEmail } from '@/lib/user-db-simple';
import { USE_NEW_AUTH_FLOW, SESSION_DURATION } from '@/config/auth-config';
import { handleApiError, ApiError, HttpStatus } from '@/lib/api-error-handler';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Choose which authentication flow to use based on config
        if (USE_NEW_AUTH_FLOW) {
            return handleNewAuthFlow(email);
        } else {
            return handleLegacyAuthFlow(email, password);
        }
    } catch (error) {
        console.error('Login error:', error);
        return handleApiError(error, 'Accesso fallito', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

/**
 * Handle login with the legacy authentication flow
 * This includes password validation
 */
async function handleLegacyAuthFlow(email: string, password: string) {
    // Basic validation
    if (!email || !password) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Email e password sono richiesti');
    }

    // Validate user credentials against database
    const user = await validateUserCredentials(email, password);

    if (!user) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Email o password non validi');
    }

    // Create session data (7 days)
    const session = {
        userId: user.id,
        expires: new Date(Date.now() + SESSION_DURATION.OLD_AUTH * 1000).toISOString(),
    };

    // Create response with user data
    const response = NextResponse.json({
        user,
        message: 'Accesso effettuato con successo'
    });

    // Set session cookie
    response.headers.set(
        'Set-Cookie',
        `session=${Buffer.from(JSON.stringify(session)).toString('base64')}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION.OLD_AUTH}`
    );

    return response;
}

/**
 * Handle login with the new simplified authentication flow
 * No password validation, only email check
 */
async function handleNewAuthFlow(email: string) {
    // Basic validation
    if (!email) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Email è richiesto');
    }

    // Authenticate user by email only
    const user = await authenticateUserByEmail(email);

    if (!user) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Utente non trovato');
    }

    // Create session data (3 hours)
    const session = {
        userId: user.id,
        expires: new Date(Date.now() + SESSION_DURATION.NEW_AUTH * 1000).toISOString(),
    };

    // Create response with user data
    const response = NextResponse.json({
        user,
        message: 'Accesso effettuato con successo'
    });

    // Set session cookie (3 hours)
    response.headers.set(
        'Set-Cookie',
        `session=${Buffer.from(JSON.stringify(session)).toString('base64')}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION.NEW_AUTH}`
    );

    return response;
}