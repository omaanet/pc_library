// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { userExists, createUser } from '@/lib/user-db';
import { getMailer } from '@/lib/mailer';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, fullName } = body;

        // Validate required fields
        if (!email || !fullName) {
            return NextResponse.json(
                { error: 'Email e nome completo sono richiesti' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Formato email non valido' },
                { status: 400 }
            );
        }

        // Check if email is already registered
        if (await userExists(email)) {
            return NextResponse.json(
                { error: 'Un utente con questa email esiste già' },
                { status: 409 }
            );
        }

        // Create a new user
        const createResult = await createUser(email, fullName);
        if (!createResult) {
            return NextResponse.json(
                { error: 'Impossibile creare l\'utente. Riprova più tardi.' },
                { status: 500 }
            );
        }
        const { userId, verificationToken } = createResult;

        // console.log('Creating user...');
        // console.log('Sending verification email...');
        const mailer = getMailer();
        // console.log('Mailer initialized');
        const emailSent = await mailer.sendVerificationEmail(email, fullName, verificationToken);
        // console.log('Email sent:', emailSent);

        if (!emailSent) {
            // If email could not be sent, return an error
            // In a production app, you might want to handle this differently,
            // perhaps by queuing the email for retry
            return NextResponse.json(
                { error: 'Impossibile inviare la mail di verifica. Riprova più tardi.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Registrazione effettuata con successo! Controlla la tua email per attivare il tuo account.',
        });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Si è verificato un errore imprevisto. Riprova più tardi.' },
            { status: 500 }
        );
    }
}
