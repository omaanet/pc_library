import { NextResponse } from 'next/server';
import { getNeonClient, extractRows } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { handleApiError } from '@/lib/api-error-handler';

function getStatsParams(request: Request) {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days') || '30';
    const limitParam = searchParams.get('limit') || '10';
    const limit = limitParam === 'all' ? 999999 : Math.max(1, Math.min(parseInt(limitParam, 10) || 10, 999999));
    const days = daysParam === 'all' ? null : Math.max(1, Math.min(parseInt(daysParam, 10) || 30, 3650));
    const daysFilter = days === null ? '' : `AND created_at >= NOW() - INTERVAL '${days} days'`;
    return { limit, daysFilter };
}

export async function GET(request: Request) {
    try {
        await requireAdmin();
        const { limit, daysFilter } = getStatsParams(request);
        const client = getNeonClient();

        const eventsOverTimeRows = extractRows(await client.query(`
            SELECT
                DATE(created_at) as date,
                COUNT(*) as plays_count,
                COUNT(DISTINCT user_id) as registered_users,
                COUNT(DISTINCT ip_hash) as anonymous_visitors
            FROM promo_audio_events
            WHERE 1 = 1
                ${daysFilter}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `));

        const topPromoPagesRows = extractRows(await client.query(`
            SELECT
                slug,
                book_title,
                COUNT(*) as play_count,
                COUNT(DISTINCT user_id) as registered_users,
                COUNT(DISTINCT ip_hash) as anonymous_visitors
            FROM promo_audio_events
            WHERE 1 = 1
                ${daysFilter}
            GROUP BY slug, book_title
            ORDER BY play_count DESC
        `)).slice(0, limit);

        const topPromoBooksRows = extractRows(await client.query(`
            SELECT
                book_id,
                book_title,
                COUNT(*) as play_count,
                COUNT(DISTINCT slug) as promo_pages,
                COUNT(DISTINCT user_id) as registered_users,
                COUNT(DISTINCT ip_hash) as anonymous_visitors
            FROM promo_audio_events
            WHERE 1 = 1
                ${daysFilter}
            GROUP BY book_id, book_title
            ORDER BY play_count DESC
        `)).slice(0, limit);

        const topRegisteredUsersRows = extractRows(await client.query(`
            SELECT
                COALESCE(user_name, 'Unknown') as user_name,
                COUNT(*) as play_count,
                COUNT(DISTINCT slug) as promo_pages
            FROM promo_audio_events
            WHERE user_id IS NOT NULL
                ${daysFilter}
            GROUP BY user_id, user_name
            ORDER BY play_count DESC
        `)).slice(0, limit);

        const totalStatsRows = extractRows(await client.query(`
            SELECT
                COUNT(*) as total_plays,
                COUNT(DISTINCT user_id) as unique_registered_users,
                COUNT(DISTINCT ip_hash) as unique_anonymous_visitors,
                COUNT(DISTINCT slug) as unique_promo_pages,
                COUNT(DISTINCT book_id) as unique_books
            FROM promo_audio_events
            WHERE 1 = 1
                ${daysFilter}
        `));

        return NextResponse.json({
            eventsOverTime: eventsOverTimeRows,
            topPromoPages: topPromoPagesRows,
            topPromoBooks: topPromoBooksRows,
            topRegisteredUsers: topRegisteredUsersRows,
            totalStats: totalStatsRows[0] || {
                total_plays: 0,
                unique_registered_users: 0,
                unique_anonymous_visitors: 0,
                unique_promo_pages: 0,
                unique_books: 0,
            },
        });
    } catch (error) {
        return handleApiError(error, 'Failed to fetch promo audio statistics');
    }
}
