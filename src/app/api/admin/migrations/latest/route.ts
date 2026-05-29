import { NextResponse } from 'next/server';
import { requirePowerAdmin } from '@/lib/admin-auth';
import { getLatestPendingMigration } from '@/lib/admin-migrations';
import { handleApiError, HttpStatus } from '@/lib/api-error-handler';

export const runtime = 'nodejs';

export async function GET() {
    try {
        await requirePowerAdmin();

        return NextResponse.json(await getLatestPendingMigration());
    } catch (error) {
        console.error('API Error fetching latest migration:', error);
        return handleApiError(error, 'Failed to fetch latest migration', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
