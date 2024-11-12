// src/app/api/user/preferences/route.ts
import { NextResponse } from 'next/server';
import { defaultUserPreferences } from '@/lib/mock/data';

export async function GET() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({ preferences: defaultUserPreferences });
}

export async function PATCH(request: Request) {
    const body = await request.json();

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
        preferences: {
            ...defaultUserPreferences,
            ...body,
        },
    });
}