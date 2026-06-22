import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/admin-auth';
import { getVisibleManagedPages } from '@/config/managed-pages';
import { getManagedPages } from '@/lib/db/queries/managed-pages';
import { handleApiError, HttpStatus } from '@/lib/api-error-handler';

export async function GET() {
    try {
        const user = await requireAuthenticatedUser();
        const pages = getVisibleManagedPages(await getManagedPages(), user.userLevel ?? 0);
        return NextResponse.json({ pages }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) {
        return handleApiError(error, 'Impossibile caricare il menu', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
