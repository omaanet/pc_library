import 'server-only';

import { createHmac } from 'crypto';
import { extractRows, getNeonClient } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-utils';

type HeaderReader = Pick<Headers, 'get'>;

export interface PromoRequestContext {
    sessionCookie?: string;
    ipAddress: string | null;
    userAgent: string | null;
    referrer: string | null;
}

interface PromoNavigationInput {
    promoPageId: number;
    slug: string;
    bookId: string;
    bookTitle: string;
    request: PromoRequestContext;
}

const BOT_USER_AGENT_PATTERN = /(?:bot|crawler|spider|slurp|bingpreview|facebookexternalhit|linkedinbot|twitterbot|whatsapp|telegrambot|discordbot|google-inspectiontool)/i;

export function getClientIp(headers: HeaderReader): string | null {
    const forwardedFor = headers.get('x-forwarded-for');
    const firstForwardedIp = forwardedFor?.split(',')[0]?.trim();
    return firstForwardedIp || headers.get('x-real-ip')?.trim() || null;
}

export function hashPromoVisitorIp(ipAddress: string): string {
    const secret = process.env.STATS_HASH_SECRET;
    if (!secret) {
        throw new Error('STATS_HASH_SECRET is required for anonymous promo statistics');
    }

    return createHmac('sha256', secret).update(ipAddress).digest('hex');
}

export function isTrackablePromoNavigation(headers: HeaderReader): boolean {
    const purpose = `${headers.get('purpose') || ''} ${headers.get('sec-purpose') || ''}`;
    if (/prefetch/i.test(purpose) || headers.get('next-router-prefetch') === '1') {
        return false;
    }

    const userAgent = headers.get('user-agent');
    return Boolean(userAgent && !BOT_USER_AGENT_PATTERN.test(userAgent));
}

export function capturePromoRequestContext(
    headers: HeaderReader,
    sessionCookie?: string
): PromoRequestContext {
    return {
        sessionCookie,
        ipAddress: getClientIp(headers),
        userAgent: headers.get('user-agent'),
        referrer: headers.get('referer'),
    };
}

export async function resolvePromoVisitor(request: PromoRequestContext) {
    const user = await getSessionUser({ cookies: { session: request.sessionCookie } });
    if (user) {
        return {
            userId: user.id,
            userName: user.fullName,
            ipHash: null,
        };
    }

    if (!request.ipAddress) return null;

    return {
        userId: null,
        userName: null,
        ipHash: hashPromoVisitorIp(request.ipAddress),
    };
}

export async function recordPromoNavigation(input: PromoNavigationInput): Promise<boolean> {
    const visitor = await resolvePromoVisitor(input.request);
    if (!visitor) return false;

    const identityConflict = visitor.userId !== null
        ? `(promo_page_id, user_id) WHERE user_id IS NOT NULL`
        : `(promo_page_id, ip_hash) WHERE user_id IS NULL AND ip_hash IS NOT NULL`;
    const result = await getNeonClient().query(
        `WITH event AS (
            INSERT INTO promo_navigation_events (
                promo_page_id,
                slug,
                book_id,
                book_title,
                user_id,
                user_name,
                ip_hash,
                user_agent,
                referrer
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT ${identityConflict}
            DO UPDATE SET count = promo_navigation_events.count + 1
            RETURNING id
         )
         INSERT INTO promo_navigation_daily_counts (event_id, event_date, count)
         SELECT id, CURRENT_DATE, 1
         FROM event
         ON CONFLICT (event_id, event_date)
         DO UPDATE SET count = promo_navigation_daily_counts.count + 1
         RETURNING event_id`,
        [
            input.promoPageId,
            input.slug,
            input.bookId,
            input.bookTitle,
            visitor.userId,
            visitor.userName,
            visitor.ipHash,
            input.request.userAgent,
            input.request.referrer,
        ]
    );

    return extractRows(result).length > 0;
}
