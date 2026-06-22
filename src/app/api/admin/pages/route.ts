import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin-auth';
import { getManagedPages, updateManagedPages, validateManagedPageUpdates } from '@/lib/db/queries/managed-pages';
import { ApiError, handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { withCSRFProtection } from '@/lib/csrf-middleware';

export async function GET() {
    try {
        await requireSuperAdmin();
        return NextResponse.json({ pages: await getManagedPages() }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) {
        return handleApiError(error, 'Impossibile caricare le pagine', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export const PATCH = withCSRFProtection(async function PATCH(request: NextRequest) {
    try {
        await requireSuperAdmin();
        const body = await request.json();
        const updates = validateManagedPageUpdates(body?.pages);
        if (!updates) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Configurazione pagine non valida');
        }
        return NextResponse.json({ pages: await updateManagedPages(updates) });
    } catch (error) {
        return handleApiError(error, 'Impossibile salvare le pagine', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});
