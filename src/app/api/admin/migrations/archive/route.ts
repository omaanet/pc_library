import { NextRequest, NextResponse } from 'next/server';
import { requireManagedPageAccess } from '@/lib/admin-auth';
import { archiveLatestPendingMigration } from '@/lib/admin-migrations';
import { ApiError, handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { withCSRFProtection } from '@/lib/csrf-middleware';

export const runtime = 'nodejs';

export const POST = withCSRFProtection(async function POST(request: NextRequest) {
    try {
        const user = await requireManagedPageAccess('migrations');
        const body = await request.json();

        if (!body || typeof body.filename !== 'string') {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Migration filename is required');
        }

        return NextResponse.json(await archiveLatestPendingMigration(body.filename, user));
    } catch (error) {
        console.error('API Error archiving migration:', error);
        return handleApiError(error, 'Failed to archive migration', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});
