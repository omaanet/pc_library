import { NextRequest, NextResponse } from 'next/server';
import { requirePowerAdmin } from '@/lib/admin-auth';
import { updateMigrationChecksum } from '@/lib/admin-migrations';
import { ApiError, handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { withCSRFProtection } from '@/lib/csrf-middleware';

export const runtime = 'nodejs';

export const POST = withCSRFProtection(async function POST(request: NextRequest) {
    try {
        await requirePowerAdmin();
        const body = await request.json();

        if (!body || typeof body.filename !== 'string') {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Migration filename is required');
        }

        return NextResponse.json(await updateMigrationChecksum(body.filename));
    } catch (error) {
        console.error('API Error updating migration checksum:', error);
        return handleApiError(error, 'Failed to update migration checksum', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});
