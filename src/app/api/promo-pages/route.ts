// src/app/api/promo-pages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllPromoPages, createPromoPage, getBookById } from '@/lib/db';
import { requireManagedPageAccess } from '@/lib/admin-auth';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { ApiError, handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { parsePromoPageBody } from '@/lib/promo-page-input';

export const runtime = 'nodejs';

/**
 * GET /api/promo-pages
 * List all promo pages (with linked book title). Power admin only.
 */
export async function GET() {
    try {
        await requireManagedPageAccess('promo-pages');
        const promoPages = await getAllPromoPages();
        return NextResponse.json({ promoPages });
    } catch (error) {
        console.error('API Error fetching promo pages:', error);
        return handleApiError(error, 'Failed to fetch promo pages', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

/**
 * POST /api/promo-pages
 * Create a promo page linked to an existing book. The slug is auto-generated
 * from the book title. Power admin only.
 */
export const POST = withCSRFProtection(async function (request: NextRequest) {
    try {
        await requireManagedPageAccess('promo-pages');

        const body = await request.json();
        const {
            bookId,
            mediaId,
            audioLength,
            isActive,
            template,
            publishingDateOverride,
            audioType,
        } = parsePromoPageBody(body, { requireBookId: true });

        // Ensure the linked book exists before creating the promo page.
        const book = await getBookById(bookId as string);
        if (!book) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Linked book not found');
        }

        const created = await createPromoPage({
            bookId: bookId as string,
            mediaId,
            audioLength,
            isActive,
            template,
            publishingDateOverride,
            audioType,
        });

        if (!created) {
            throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to create promo page');
        }

        return NextResponse.json(created, { status: HttpStatus.CREATED });
    } catch (error) {
        console.error('API Error creating promo page:', error);
        return handleApiError(error, 'Failed to create promo page', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});
