import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin-auth';
import { getManagedPages, updateManagedPages, validateManagedPageUpdates } from '@/lib/db/queries/managed-pages';
import { ApiError, handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { isBookAccessSettings } from '@/config/book-access';
import {
    getBookAccessSettings,
    updateBookAccessSettings,
} from '@/lib/db/queries/book-access-settings';

export async function GET() {
    try {
        await requireSuperAdmin();
        const [pages, bookAccess] = await Promise.all([
            getManagedPages(),
            getBookAccessSettings(),
        ]);
        return NextResponse.json(
            { pages, bookAccess },
            { headers: { 'Cache-Control': 'private, no-store' } }
        );
    } catch (error) {
        return handleApiError(error, 'Impossibile caricare le pagine', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export const PATCH = withCSRFProtection(async function PATCH(request: NextRequest) {
    try {
        await requireSuperAdmin();
        const body = await request.json();
        const updates = validateManagedPageUpdates(body?.pages);
        if (!updates || !isBookAccessSettings(body?.bookAccess)) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Configurazione pagine non valida');
        }
        const pages = await updateManagedPages(updates);
        const bookAccess = await updateBookAccessSettings(body.bookAccess);
        return NextResponse.json({ pages, bookAccess });
    } catch (error) {
        return handleApiError(error, 'Impossibile salvare le pagine', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});
