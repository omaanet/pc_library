import { NextResponse } from 'next/server';
import { getNeonClient, extractRows } from '@/lib/db';
import { requireManagedPageAccess } from '@/lib/admin-auth';
import { handleApiError } from '@/lib/api-error-handler';
import { getMaintenanceUserFilter, getPromoAnonymousMaintenanceFilter } from '@/lib/statistics-maintenance-ip';

function getStatsParams(request: Request) {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days') || '30';
    const limitParam = searchParams.get('limit') || '10';
    const limit = limitParam === 'all' ? 999999 : Math.max(1, Math.min(parseInt(limitParam, 10) || 10, 999999));
    const days = daysParam === 'all' ? null : Math.max(1, Math.min(parseInt(daysParam, 10) || 30, 3650));
    const dailyDaysFilter = days === null
        ? ''
        : `AND d.event_date >= CURRENT_DATE - ${days - 1}`;
    return { limit, dailyDaysFilter };
}

export async function GET(request: Request) {
    try {
        await requireManagedPageAccess('statistics');
        const { limit, dailyDaysFilter } = getStatsParams(request);
        const navigationMaintenanceUserFilter = getMaintenanceUserFilter(request, 'n.user_id');
        const navigationAnonymousMaintenanceFilter = getPromoAnonymousMaintenanceFilter(request, 'n.ip_hash');
        const audioMaintenanceUserFilter = getMaintenanceUserFilter(request, 'a.user_id');
        const audioAnonymousMaintenanceFilter = getPromoAnonymousMaintenanceFilter(request, 'a.ip_hash');
        const client = getNeonClient();

        const navigationOverTimeRows = extractRows(await client.query(`
            SELECT
                d.event_date as date,
                SUM(d.count) as navigations_count,
                SUM(d.count) FILTER (WHERE n.user_id IS NOT NULL) as registered_visitors,
                SUM(d.count) FILTER (WHERE n.user_id IS NULL) as anonymous_visitors,
                COUNT(DISTINCT n.id) FILTER (WHERE EXISTS (
                    SELECT 1
                    FROM promo_audio_events a
                    WHERE a.promo_page_id = n.promo_page_id
                        AND (
                            (n.user_id IS NOT NULL AND a.user_id = n.user_id)
                            OR (n.user_id IS NULL AND a.user_id IS NULL AND a.ip_hash = n.ip_hash)
                        )
                        AND ${audioMaintenanceUserFilter}
                        AND ${audioAnonymousMaintenanceFilter}
                )) as converted_visitors
            FROM promo_navigation_daily_counts d
            JOIN promo_navigation_events n ON n.id = d.event_id
            WHERE 1 = 1
                AND ${navigationMaintenanceUserFilter}
                AND ${navigationAnonymousMaintenanceFilter}
                ${dailyDaysFilter}
            GROUP BY d.event_date
            ORDER BY date DESC
        `));

        const eventsOverTimeRows = extractRows(await client.query(`
            SELECT
                d.event_date as date,
                SUM(d.count) as plays_count,
                COUNT(DISTINCT a.user_id) as registered_users,
                COUNT(DISTINCT a.ip_hash) as anonymous_visitors
            FROM promo_audio_daily_counts d
            JOIN promo_audio_events a ON a.id = d.event_id
            WHERE 1 = 1
                AND ${audioMaintenanceUserFilter}
                AND ${audioAnonymousMaintenanceFilter}
                ${dailyDaysFilter}
            GROUP BY d.event_date
            ORDER BY date DESC
        `));

        const topPromoPagesRows = extractRows(await client.query(`
            SELECT
                a.slug,
                a.book_title,
                SUM(d.count) as play_count,
                COUNT(DISTINCT a.user_id) as registered_users,
                COUNT(DISTINCT a.ip_hash) as anonymous_visitors
            FROM promo_audio_daily_counts d
            JOIN promo_audio_events a ON a.id = d.event_id
            WHERE 1 = 1
                AND ${audioMaintenanceUserFilter}
                AND ${audioAnonymousMaintenanceFilter}
                ${dailyDaysFilter}
            GROUP BY a.slug, a.book_title
            ORDER BY play_count DESC
        `)).slice(0, limit);

        const topPromoBooksRows = extractRows(await client.query(`
            SELECT
                a.book_id,
                a.book_title,
                SUM(d.count) as play_count,
                COUNT(DISTINCT a.slug) as promo_pages,
                COUNT(DISTINCT a.user_id) as registered_users,
                COUNT(DISTINCT a.ip_hash) as anonymous_visitors
            FROM promo_audio_daily_counts d
            JOIN promo_audio_events a ON a.id = d.event_id
            WHERE 1 = 1
                AND ${audioMaintenanceUserFilter}
                AND ${audioAnonymousMaintenanceFilter}
                ${dailyDaysFilter}
            GROUP BY a.book_id, a.book_title
            ORDER BY play_count DESC
        `)).slice(0, limit);

        const topRegisteredUsersRows = extractRows(await client.query(`
            SELECT
                CASE
                    WHEN a.user_id IS NULL THEN 'unregistered'
                    ELSE COALESCE(a.user_name, 'Unknown')
                END as user_name,
                SUM(d.count) as play_count,
                COUNT(DISTINCT a.slug) as promo_pages
            FROM promo_audio_daily_counts d
            JOIN promo_audio_events a ON a.id = d.event_id
            WHERE 1 = 1
                AND ${audioMaintenanceUserFilter}
                AND ${audioAnonymousMaintenanceFilter}
                ${dailyDaysFilter}
            GROUP BY
                CASE WHEN a.user_id IS NULL THEN NULL ELSE a.user_id END,
                CASE
                    WHEN a.user_id IS NULL THEN 'unregistered'
                    ELSE COALESCE(a.user_name, 'Unknown')
                END
            ORDER BY play_count DESC
        `)).slice(0, limit);

        const topNavigationPagesRows = extractRows(await client.query(`
            SELECT
                n.slug,
                n.book_title,
                SUM(d.count) as navigation_count,
                COUNT(DISTINCT n.id) FILTER (WHERE n.user_id IS NOT NULL) as registered_visitors,
                COUNT(DISTINCT n.id) FILTER (WHERE n.user_id IS NULL) as anonymous_visitors,
                COUNT(DISTINCT n.id) FILTER (WHERE EXISTS (
                    SELECT 1
                    FROM promo_audio_events a
                    WHERE a.promo_page_id = n.promo_page_id
                        AND (
                            (n.user_id IS NOT NULL AND a.user_id = n.user_id)
                            OR (n.user_id IS NULL AND a.user_id IS NULL AND a.ip_hash = n.ip_hash)
                        )
                        AND ${audioMaintenanceUserFilter}
                        AND ${audioAnonymousMaintenanceFilter}
                )) as converted_visitors,
                ROUND(
                    100.0 * COUNT(DISTINCT n.id) FILTER (WHERE EXISTS (
                        SELECT 1
                        FROM promo_audio_events a
                        WHERE a.promo_page_id = n.promo_page_id
                            AND (
                                (n.user_id IS NOT NULL AND a.user_id = n.user_id)
                                OR (n.user_id IS NULL AND a.user_id IS NULL AND a.ip_hash = n.ip_hash)
                            )
                            AND ${audioMaintenanceUserFilter}
                            AND ${audioAnonymousMaintenanceFilter}
                    )) / NULLIF(COUNT(DISTINCT n.id), 0),
                    2
                ) as conversion_rate
            FROM promo_navigation_daily_counts d
            JOIN promo_navigation_events n ON n.id = d.event_id
            WHERE 1 = 1
                AND ${navigationMaintenanceUserFilter}
                AND ${navigationAnonymousMaintenanceFilter}
                ${dailyDaysFilter}
            GROUP BY n.slug, n.book_title
            ORDER BY navigation_count DESC
        `)).slice(0, limit);

        const topNavigationBooksRows = extractRows(await client.query(`
            SELECT
                n.book_id,
                n.book_title,
                SUM(d.count) as navigation_count,
                COUNT(DISTINCT n.slug) as promo_pages,
                COUNT(DISTINCT n.id) FILTER (WHERE EXISTS (
                    SELECT 1
                    FROM promo_audio_events a
                    WHERE a.promo_page_id = n.promo_page_id
                        AND (
                            (n.user_id IS NOT NULL AND a.user_id = n.user_id)
                            OR (n.user_id IS NULL AND a.user_id IS NULL AND a.ip_hash = n.ip_hash)
                        )
                        AND ${audioMaintenanceUserFilter}
                        AND ${audioAnonymousMaintenanceFilter}
                )) as converted_visitors,
                ROUND(
                    100.0 * COUNT(DISTINCT n.id) FILTER (WHERE EXISTS (
                        SELECT 1
                        FROM promo_audio_events a
                        WHERE a.promo_page_id = n.promo_page_id
                            AND (
                                (n.user_id IS NOT NULL AND a.user_id = n.user_id)
                                OR (n.user_id IS NULL AND a.user_id IS NULL AND a.ip_hash = n.ip_hash)
                            )
                            AND ${audioMaintenanceUserFilter}
                            AND ${audioAnonymousMaintenanceFilter}
                    )) / NULLIF(COUNT(DISTINCT n.id), 0),
                    2
                ) as conversion_rate
            FROM promo_navigation_daily_counts d
            JOIN promo_navigation_events n ON n.id = d.event_id
            WHERE 1 = 1
                AND ${navigationMaintenanceUserFilter}
                AND ${navigationAnonymousMaintenanceFilter}
                ${dailyDaysFilter}
            GROUP BY n.book_id, n.book_title
            ORDER BY navigation_count DESC
        `)).slice(0, limit);

        const totalStatsRows = extractRows(await client.query(`
            SELECT
                COALESCE(SUM(d.count), 0) as total_plays,
                COUNT(DISTINCT a.user_id) as unique_registered_users,
                COUNT(DISTINCT a.ip_hash) as unique_anonymous_visitors,
                COUNT(DISTINCT a.slug) as unique_promo_pages,
                COUNT(DISTINCT a.book_id) as unique_books
            FROM promo_audio_daily_counts d
            JOIN promo_audio_events a ON a.id = d.event_id
            WHERE 1 = 1
                AND ${audioMaintenanceUserFilter}
                AND ${audioAnonymousMaintenanceFilter}
                ${dailyDaysFilter}
        `));

        const navigationTotalStatsRows = extractRows(await client.query(`
            SELECT
                COALESCE(SUM(d.count), 0) as total_navigations,
                COALESCE(SUM(d.count) FILTER (WHERE n.user_id IS NOT NULL), 0) as registered_navigations,
                COALESCE(SUM(d.count) FILTER (WHERE n.user_id IS NULL), 0) as anonymous_navigations,
                COUNT(DISTINCT n.user_id) as unique_registered_navigation_visitors,
                COUNT(DISTINCT n.ip_hash) as unique_anonymous_navigation_visitors,
                COUNT(DISTINCT n.id) FILTER (WHERE EXISTS (
                    SELECT 1
                    FROM promo_audio_events a
                    WHERE a.promo_page_id = n.promo_page_id
                        AND (
                            (n.user_id IS NOT NULL AND a.user_id = n.user_id)
                            OR (n.user_id IS NULL AND a.user_id IS NULL AND a.ip_hash = n.ip_hash)
                        )
                        AND ${audioMaintenanceUserFilter}
                        AND ${audioAnonymousMaintenanceFilter}
                )) as converted_visitors,
                COALESCE(ROUND(
                    100.0 * COUNT(DISTINCT n.id) FILTER (WHERE EXISTS (
                        SELECT 1
                        FROM promo_audio_events a
                        WHERE a.promo_page_id = n.promo_page_id
                            AND (
                                (n.user_id IS NOT NULL AND a.user_id = n.user_id)
                                OR (n.user_id IS NULL AND a.user_id IS NULL AND a.ip_hash = n.ip_hash)
                            )
                            AND ${audioMaintenanceUserFilter}
                            AND ${audioAnonymousMaintenanceFilter}
                    )) / NULLIF(COUNT(DISTINCT n.id), 0),
                    2
                ), 0) as conversion_rate
            FROM promo_navigation_daily_counts d
            JOIN promo_navigation_events n ON n.id = d.event_id
            WHERE 1 = 1
                AND ${navigationMaintenanceUserFilter}
                AND ${navigationAnonymousMaintenanceFilter}
                ${dailyDaysFilter}
        `));

        const navigationStats = navigationTotalStatsRows[0] || {
            total_navigations: 0,
            registered_navigations: 0,
            anonymous_navigations: 0,
            unique_registered_navigation_visitors: 0,
            unique_anonymous_navigation_visitors: 0,
            converted_visitors: 0,
            conversion_rate: 0,
        };
        const audioStats = totalStatsRows[0] || {
            total_plays: 0,
            unique_registered_users: 0,
            unique_anonymous_visitors: 0,
            unique_promo_pages: 0,
            unique_books: 0,
        };

        return NextResponse.json({
            eventsOverTime: eventsOverTimeRows,
            navigationOverTime: navigationOverTimeRows,
            topPromoPages: topPromoPagesRows,
            topPromoBooks: topPromoBooksRows,
            topRegisteredUsers: topRegisteredUsersRows,
            topNavigationPages: topNavigationPagesRows,
            topNavigationBooks: topNavigationBooksRows,
            navigationStats,
            totalStats: { ...audioStats, ...navigationStats },
        });
    } catch (error) {
        return handleApiError(error, 'Failed to fetch promo audio statistics');
    }
}
