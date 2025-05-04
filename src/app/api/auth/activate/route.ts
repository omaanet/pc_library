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
                { error: 'Verification token is required' },
                { status: 400 }
            );
        }

        // Find the user by verification token
        const user = findUserByVerificationToken(token);
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid or expired verification token' },
                { status: 400 }
            );
        }

        // Initialize Italian Markov password generator for memorable passwords
        const markovGen = new ItalianMarkovPasswordGenerator();

        // Generate a password using Italian Markov generator for better memorability
        const password = markovGen.generatePassword({ minLength: 8, maxLength: 8 });

        // Activate the user account
        const activated = activateUser(user.id, password);
        if (!activated) {
            return NextResponse.json(
                { error: 'Failed to activate account' },
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
        const completeUser = getUserById(user.id);
        if (!completeUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Create a session for the user
        // In a real app, you would use a proper session management library
        const session = {
            user: completeUser,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };

        return NextResponse.json({
            success: true,
            message: 'Account activated successfully',
            user: completeUser,
            session,
        }, {
            headers: {
                // Set a cookie for the session
                'Set-Cookie': `session=${Buffer.from(JSON.stringify({
                    userId: completeUser.id,
                    expires: session.expires.toISOString(),
                })).toString('base64')}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
            },
        });
    } catch (error) {
        console.error('Activation error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again later.' },
            { status: 500 }
        );
    }
}
