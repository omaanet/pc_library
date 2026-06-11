// src/app/api/promo-pages/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updatePromoPage, deletePromoPage, getBookById } from '@/lib/db';
import { requirePowerAdmin } from '@/lib/admin-auth';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { ApiError, handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { parsePromoPageBody } from '@/lib/promo-page-input';

export const runtime = 'nodejs';

function parseId(raw: string): number {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid promo page id');
    }
    return id;
}

/**
 * PUT /api/promo-pages/[id]
 * Update promo-specific fields (media id, audio length, enabled). Power admin only.
 */
export const PUT = withCSRFProtection(async function (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePowerAdmin();

        const id = parseId((await params).id);
        const body = await request.json();
        const { bookId, mediaId, audioLength, isActive, template } = parsePromoPageBody(body, { requireBookId: true });

        // Ensure the (possibly changed) linked book exists before updating.
        const book = await getBookById(bookId as string);
        if (!book) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Linked book not found');
        }

        const updated = await updatePromoPage(id, { bookId: bookId as string, mediaId, audioLength, isActive, template });
        if (!updated) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Promo page not found');
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('API Error updating promo page:', error);
        return handleApiError(error, 'Failed to update promo page', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});

/**
 * DELETE /api/promo-pages/[id]
 * Delete a promo page. Power admin only.
 */
export const DELETE = withCSRFProtection(async function (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePowerAdmin();

        const id = parseId((await params).id);
        const deleted = await deletePromoPage(id);
        if (!deleted) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Promo page not found');
        }

        return new NextResponse(null, { status: HttpStatus.NO_CONTENT });
    } catch (error) {
        console.error('API Error deleting promo page:', error);
        return handleApiError(error, 'Failed to delete promo page', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});
