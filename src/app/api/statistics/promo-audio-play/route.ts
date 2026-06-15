import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getBookById, getNeonClient, getPromoPageBySlug } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-utils';
import { ApiError, handleApiError, HttpStatus } from '@/lib/api-error-handler';

function getClientIp(request: NextRequest): string | null {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const firstForwardedIp = forwardedFor?.split(',')[0]?.trim();
    return firstForwardedIp || request.headers.get('x-real-ip') || null;
}

function hashIp(ipAddress: string): string {
    const secret = process.env.STATS_HASH_SECRET;
    if (!secret) {
        throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'STATS_HASH_SECRET is required for anonymous promo statistics');
    }

    return createHmac('sha256', secret).update(ipAddress).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({})) as {
            slug?: unknown;
            promoPageId?: unknown;
            bookId?: unknown;
            mediaId?: unknown;
        };
        const slug = typeof body.slug === 'string' ? body.slug : '';
        const bookId = typeof body.bookId === 'string' ? body.bookId : '';
        const mediaId = typeof body.mediaId === 'string' ? body.mediaId : '';
        const promoPageId = typeof body.promoPageId === 'number' ? body.promoPageId : null;

        if (!slug || !bookId || !mediaId) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Missing promo audio tracking fields');
        }

        const promoPage = await getPromoPageBySlug(slug);
        if (!promoPage || !promoPage.isActive || promoPage.bookId !== bookId || promoPage.mediaId !== mediaId) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Promo page not found');
        }
        if (promoPageId !== null && promoPage.id !== promoPageId) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid promo page id');
        }

        const book = await getBookById(bookId);
        if (!book) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Book not found');
        }

        const user = await getSessionUser(request);
        const ipHash = user ? null : hashIp(getClientIp(request) || 'unknown');
        const client = getNeonClient();

        await client.query(
            `INSERT INTO promo_audio_events (
                promo_page_id,
                slug,
                book_id,
                book_title,
                media_id,
                user_id,
                user_name,
                ip_hash,
                user_agent,
                referrer
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                promoPage.id,
                promoPage.slug,
                book.id,
                book.title,
                promoPage.mediaId,
                user?.id ?? null,
                user?.fullName ?? null,
                ipHash,
                request.headers.get('user-agent'),
                request.headers.get('referer'),
            ]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, 'Failed to track promo audio play');
    }
}
