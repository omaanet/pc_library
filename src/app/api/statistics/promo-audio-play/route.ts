import { NextRequest, NextResponse } from 'next/server';
import { getBookById, getNeonClient, getPromoPageBySlug } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-utils';
import { ApiError, handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { getClientIp, hashPromoVisitorIp } from '@/lib/promo-statistics';

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
        const clientIp = getClientIp(request.headers);
        if (!user && !clientIp) {
            return NextResponse.json({ success: true, tracked: false });
        }
        const ipHash = user ? null : hashPromoVisitorIp(clientIp!);
        const client = getNeonClient();

        const identityConflict = user
            ? `(promo_page_id, user_id) WHERE user_id IS NOT NULL`
            : `(promo_page_id, ip_hash) WHERE user_id IS NULL AND ip_hash IS NOT NULL`;

        await client.query(
            `WITH event AS (
                INSERT INTO promo_audio_events (
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
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT ${identityConflict}
                DO UPDATE SET count = promo_audio_events.count + 1
                RETURNING id
             )
             INSERT INTO promo_audio_daily_counts (event_id, event_date, count)
             SELECT id, CURRENT_DATE, 1
             FROM event
             ON CONFLICT (event_id, event_date)
             DO UPDATE SET count = promo_audio_daily_counts.count + 1`,
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
