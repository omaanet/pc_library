// src/app/api/auth/activate/route.ts
import { NextResponse } from 'next/server';
import { findUserByVerificationToken, activateUser, getUserById } from '@/lib/user-db';
import { getMailer } from '@/lib/mailer';
import { ItalianMarkovPasswordGenerator } from '@/lib/italian-markov-password-generator';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json(
                { error: 'Token di verifica richiesto' },
                { status: 400 }
            );
        }

        // Find the user by verification token
        const user = await findUserByVerificationToken(token);
        if (!user) {
            // Try to find a user who previously had this token, even if already activated
            // We'll need to check the database for a user with verification_token = NULL and is_activated = TRUE
            // This requires a query by token (even if now null) or by email if you can get it from the frontend
            // Instead, let's check all users for a matching token, and if not, try by email (if provided)
            // But since token is now null after activation, we can't find by token anymore
            // So, we return a specific error for "already activated" if the token is not found but the user exists and is activated

            // Try to find a user who was activated recently (edge case: frontend could pass email as fallback)
            // For now, return a friendly message
            return NextResponse.json(
                { error: 'Token di verifica non valido o già utilizzato. L\'account potrebbe essere già stato attivato.' },
                { status: 400 }
            );
        }

        // Check if already activated
        const completeUser = await getUserById(user.id);
        if (completeUser && completeUser.isActivated) {
            return NextResponse.json(
                {
                    success: true,
                    alreadyActivated: true,
                    message: 'Il tuo account è già stato attivato. Puoi effettuare il login.',
                    user: completeUser
                },
                { status: 200 }
            );
        }

        // Initialize Italian Markov password generator for memorable passwords
        const markovGen = new ItalianMarkovPasswordGenerator();

        // Generate a password using Italian Markov generator for better memorability
        const password = markovGen.generatePassword({ minLength: 8, maxLength: 8 });

        // Activate the user account
        const activated = await activateUser(user.id, password);
        if (!activated) {
            return NextResponse.json(
                { error: 'Impossibile attivare l\'account' },
                { status: 500 }
            );
        }

        // Send welcome email with the generated password
        const mailer = getMailer();
        const emailSent = await mailer.sendWelcomeEmail(user.email, user.fullName, password);

        if (!emailSent) {
            console.error('Failed to send welcome email');
            // Continue with the process even if the email fails
            // In a production app, you might want to queue this email for retry
        }

        // Get the complete user object for the session
        const updatedUser = await getUserById(user.id);
        if (!updatedUser) {
            return NextResponse.json(
                { error: 'Utente non trovato' },
                { status: 404 }
            );
        }

        // Create a session for the user
        const session = {
            user: updatedUser,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };

        return NextResponse.json({
            success: true,
            message: 'Account attivato con successo',
            user: updatedUser,
            session,
        }, {
            headers: {
                // Set a cookie for the session
                'Set-Cookie': `session=${Buffer.from(JSON.stringify({
                    userId: updatedUser.id,
                    expires: session.expires.toISOString(),
                })).toString('base64')}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
            },
        });
    } catch (error) {
        console.error('Activation error:', error);
        return NextResponse.json(
            { error: 'Si è verificato un errore imprevisto. Riprova più tardi.' },
            { status: 500 }
        );
    }
}
