// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();

    // Simulate basic validation
    if (!body.email || !body.fullName) {
        return NextResponse.json(
            { error: 'Email and full name are required' },
            { status: 400 }
        );
    }

    // Simulate registration delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
        success: true,
        message: 'Registration successful! Please check your email to activate your account.',
    });
}
