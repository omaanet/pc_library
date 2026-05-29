import { NextResponse } from 'next/server';
import { requirePowerAdmin } from '@/lib/admin-auth';
import { getArchivedMigrations } from '@/lib/admin-migrations';
import { handleApiError, HttpStatus } from '@/lib/api-error-handler';

export const runtime = 'nodejs';

export async function GET() {
    try {
        await requirePowerAdmin();

        return NextResponse.json(await getArchivedMigrations());
    } catch (error) {
        console.error('API Error fetching archived migrations:', error);
        return handleApiError(error, 'Failed to fetch archived migrations', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
