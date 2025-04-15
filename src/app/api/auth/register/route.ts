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
                { error: 'Email and full name are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Create the user or get existing unactivated user
        const result = createUser(email, fullName);

        // If result is null, an account with this email already exists and is activated
        if (!result) {
            return NextResponse.json(
                { error: 'A user with this email already exists and is activated' },
                { status: 409 } // Conflict
            );
        }

        const { userId, verificationToken } = result;

        console.log('Creating user...');
        console.log('Sending verification email...');
        const mailer = getMailer();
        console.log('Mailer initialized');
        const emailSent = await mailer.sendVerificationEmail(email, fullName, verificationToken);
        console.log('Email sent:', emailSent);

        if (!emailSent) {
            // If email could not be sent, return an error
            // In a production app, you might want to handle this differently,
            // perhaps by queuing the email for retry
            return NextResponse.json(
                { error: 'Failed to send verification email. Please try again later.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Registration successful! Please check your email to activate your account.',
        });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again later.' },
            { status: 500 }
        );
    }
}
