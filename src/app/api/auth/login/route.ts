// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { validateUserCredentials } from '@/lib/user-db';
import { authenticateUserByEmail } from '@/lib/user-db-simple';
import { USE_NEW_AUTH_FLOW, SESSION_DURATION } from '@/config/auth-config';

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
        return NextResponse.json(
            { error: 'Accesso fallito' },
            { status: 500 }
        );
    }
}

/**
 * Handle login with the legacy authentication flow
 * This includes password validation
 */
async function handleLegacyAuthFlow(email: string, password: string) {
    // Basic validation
    if (!email || !password) {
        return NextResponse.json(
            { error: 'Email e password sono richiesti' },
            { status: 400 }
        );
    }

    // Validate user credentials against database
    const user = await validateUserCredentials(email, password);

    if (!user) {
        return NextResponse.json(
            { error: 'Email o password non validi' },
            { status: 401 }
        );
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
        return NextResponse.json(
            { error: 'Email è richiesto' },
            { status: 400 }
        );
    }

    // Authenticate user by email only
    const user = await authenticateUserByEmail(email);

    if (!user) {
        return NextResponse.json(
            { error: 'Utente non trovato' },
            { status: 401 }
        );
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