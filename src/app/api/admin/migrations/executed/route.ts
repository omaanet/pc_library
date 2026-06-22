import { NextResponse } from 'next/server';
import { requireManagedPageAccess } from '@/lib/admin-auth';
import { getExecutedMigrations } from '@/lib/admin-migrations';
import { handleApiError, HttpStatus } from '@/lib/api-error-handler';

export const runtime = 'nodejs';

export async function GET() {
    try {
        await requireManagedPageAccess('migrations');

        return NextResponse.json(await getExecutedMigrations());
    } catch (error) {
        console.error('API Error fetching executed migrations:', error);
        return handleApiError(error, 'Failed to fetch executed migrations', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
