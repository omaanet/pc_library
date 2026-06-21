// src/app/api/user/preferences/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiError, handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { getCurrentSessionUser } from '@/lib/auth-utils';
import { getUserPreferences, upsertUserPreferences } from '@/lib/db';

const preferencesPatchSchema = z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    bookBadgePalette: z.enum(['gold', 'ocean', 'lagoon', 'lavender', 'coral', 'paper']).optional(),
    readerViewMode: z.enum(['single', 'double']).optional(),
    readerZoom: z.number().min(0.1).max(3).optional(),
}).strict();

export async function GET() {
    try {
        const user = await requireUser();
        const preferences = await getUserPreferences(user.id);

        return preferencesResponse(preferences);
    } catch (error) {
        console.error('Error fetching user preferences:', error);
        return handleApiError(error, 'Failed to fetch user preferences', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export const PATCH = withCSRFProtection(async function(request: Request) {
    try {
        const user = await requireUser();
        const parsed = preferencesPatchSchema.safeParse(await request.json());
        if (!parsed.success) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Preferenze non valide', {
                issues: parsed.error.issues,
            });
        }

        const preferences = await upsertUserPreferences(user.id, parsed.data);
        return preferencesResponse(preferences);
    } catch (error) {
        console.error('Error updating user preferences:', error);
        return handleApiError(error, 'Failed to update user preferences', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});

async function requireUser() {
    const user = await getCurrentSessionUser();
    if (!user) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Autenticazione richiesta');
    }
    return user;
}

function preferencesResponse(preferences: Awaited<ReturnType<typeof getUserPreferences>>) {
    return NextResponse.json(
        { preferences },
        { headers: { 'Cache-Control': 'private, no-store' } }
    );
}
