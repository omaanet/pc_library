// src/app/api/user/preferences/route.ts
import { NextResponse } from 'next/server';

// Define default preferences directly
const defaultUserPreferences = {
    theme: 'light',
    fontSize: 'medium',
    showRecommendations: false,
    notifications: false,
};

export async function GET() {
    // Simulate network delay
    // await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({ preferences: defaultUserPreferences });
}

export async function PATCH(request: Request) {
    const body = await request.json();

    // Simulate network delay
    // await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
        preferences: {
            ...defaultUserPreferences,
            ...body,
        },
    });
}