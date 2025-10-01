// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { userExists, createUser } from '@/lib/user-db';
import { createUserSimple } from '@/lib/user-db-simple';
import { getMailer } from '@/lib/mailer';
import { USE_NEW_AUTH_FLOW, SESSION_DURATION } from '@/config/auth-config';
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

        // Check if email is already registered
        if (await userExists(email)) {
            throw new ApiError(HttpStatus.CONFLICT, 'Un utente con questa email esiste già');
        }

        // Choose which authentication flow to use based on config
        if (USE_NEW_AUTH_FLOW) {
            return handleNewAuthFlow(email, fullName);
        } else {
            return handleLegacyAuthFlow(email, fullName);
        }
    } catch (error) {
        console.error('Registration error:', error);
        return handleApiError(error, 'Si è verificato un errore imprevisto. Riprova più tardi.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

/**
 * Handle registration with the legacy authentication flow
 * This includes email verification and account activation
 */
async function handleLegacyAuthFlow(email: string, fullName: string) {
    // Create a new user
    const createResult = await createUser(email, fullName);
    if (!createResult) {
        throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Impossibile creare l\'utente. Riprova più tardi.');
    }
    const { userId, verificationToken } = createResult;

    // Send verification email
    const mailer = getMailer();
    const emailSent = await mailer.sendVerificationEmail(email, fullName, verificationToken);

    if (!emailSent) {
        // If email could not be sent, return an error
        throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Impossibile inviare la mail di verifica. Riprova più tardi.');
    }

    return NextResponse.json({
        success: true,
        message: 'Registrazione effettuata con successo! Controlla la tua email per attivare il tuo account.',
    });
}

/**
 * Handle registration with the new simplified authentication flow
 * No email verification, immediate activation, no password
 */
async function handleNewAuthFlow(email: string, fullName: string) {
    // Create a new user with simplified flow (already activated)
    const createResult = await createUserSimple(email, fullName);
    if (!createResult) {
        throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Impossibile creare l\'utente. Riprova più tardi.');
    }
    
    // Create session data (3 hours)
    const session = {
        userId: String(createResult.userId),
        expires: new Date(Date.now() + SESSION_DURATION.NEW_AUTH * 1000).toISOString(), // 3 hours
    };

    // Create response with success message
    const response = NextResponse.json({
        success: true,
        message: 'Registrazione effettuata con successo! Sarai reindirizzato alla home page.',
        redirectAfterSeconds: 3,
    });

    // Set session cookie
    response.headers.set(
        'Set-Cookie',
        `session=${Buffer.from(JSON.stringify(session)).toString('base64')}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION.NEW_AUTH}`
    );

    return response;
}
