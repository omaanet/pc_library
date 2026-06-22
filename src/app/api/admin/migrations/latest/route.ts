import { NextResponse } from 'next/server';
import { requireManagedPageAccess } from '@/lib/admin-auth';
import { getLatestPendingMigration } from '@/lib/admin-migrations';
import { handleApiError, HttpStatus } from '@/lib/api-error-handler';

export const runtime = 'nodejs';

export async function GET() {
    try {
        await requireManagedPageAccess('migrations');

        return NextResponse.json(await getLatestPendingMigration());
    } catch (error) {
        console.error('API Error fetching latest migration:', error);
        return handleApiError(error, 'Failed to fetch latest migration', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
