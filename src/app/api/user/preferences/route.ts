// src/app/api/user/preferences/route.ts
import { NextResponse } from 'next/server';
import { handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { withCSRFProtection } from '@/lib/csrf-middleware';

// Define default preferences directly
const defaultUserPreferences = {
    theme: 'light',
    fontSize: 'medium',
    showRecommendations: false,
    notifications: false,
};

export async function GET() {
    try {
        // Simulate network delay
        // await new Promise(resolve => setTimeout(resolve, 500));

        return NextResponse.json({ preferences: defaultUserPreferences });
    } catch (error) {
        console.error('Error fetching user preferences:', error);
        return handleApiError(error, 'Failed to fetch user preferences', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export const PATCH = withCSRFProtection(async function(request: Request) {
    try {
        const body = await request.json();

        // Simulate network delay
        // await new Promise(resolve => setTimeout(resolve, 500));

        return NextResponse.json({
            preferences: {
                ...defaultUserPreferences,
                ...body,
            },
        });
    } catch (error) {
        console.error('Error updating user preferences:', error);
        return handleApiError(error, 'Failed to update user preferences', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});