import { NextResponse } from 'next/server';
import { getNeonClient, extractRows } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { handleApiError } from '@/lib/api-error-handler';
import { SITE_CONFIG } from '@/config/site-config';
import { getMaintenanceIpFilter } from '@/lib/statistics-maintenance-ip';

function getStatsParams(request: Request) {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days') || '30';
    const limitParam = searchParams.get('limit') || '10';
    const limit = limitParam === 'all' ? 999999 : Math.max(1, Math.min(parseInt(limitParam, 10) || 10, 999999));
    const days = daysParam === 'all' ? null : Math.max(1, Math.min(parseInt(daysParam, 10) || 30, 3650));
    const daysFilter = days === null ? '' : `AND created_at >= NOW() - INTERVAL '${days} days'`;
    const slDaysFilter = days === null ? '' : `AND sl.created_at >= NOW() - INTERVAL '${days} days'`;
    return { limit, daysFilter, slDaysFilter };
}

export async function GET(request: Request) {
    try {
        await requireAdmin();
        const { limit, daysFilter, slDaysFilter } = getStatsParams(request);
        const maintenanceIpFilter = getMaintenanceIpFilter(request);
        const slMaintenanceIpFilter = getMaintenanceIpFilter(request, 'sl.ip_address');
        const client = getNeonClient();

        const listensOverTimeRows = extractRows(await client.query(`
            SELECT
                DATE(created_at) as date,
                COUNT(*) as listens_count,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT details->>'bookId') as unique_books
            FROM system_logs
            WHERE source = 'audio-book'
                AND message = '[audio-play]'
                AND level = 'info'
                AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION}
                AND ${maintenanceIpFilter}
                ${daysFilter}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `));

        const mostListenedBooksRows = extractRows(await client.query(`
            SELECT
                COALESCE(details->>'bookTitle', 'Unknown') as book_title,
                COALESCE(details->>'bookId', 'unknown') as book_id,
                COUNT(*) as listen_count,
                COUNT(DISTINCT user_id) as unique_listeners,
                COUNT(CASE WHEN details->>'isAudioOnly' = 'true' THEN 1 END) as audio_only_listens
            FROM system_logs
            WHERE source = 'audio-book'
                AND message = '[audio-play]'
                AND level = 'info'
                AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION}
                AND ${maintenanceIpFilter}
                ${daysFilter}
            GROUP BY details->>'bookTitle', details->>'bookId'
            ORDER BY listen_count DESC
        `)).slice(0, limit);

        const topListenersRows = extractRows(await client.query(`
            SELECT
                u.full_name,
                u.email,
                COUNT(*) as listen_count,
                COUNT(DISTINCT sl.details->>'bookId') as unique_books
            FROM system_logs sl
            JOIN users u ON sl.user_id = u.id
            WHERE sl.source = 'audio-book'
                AND sl.message = '[audio-play]'
                AND sl.level = 'info'
                AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION.replace(/ip_address/g, 'sl.ip_address')}
                AND ${slMaintenanceIpFilter}
                ${slDaysFilter}
            GROUP BY u.id, u.full_name, u.email
            ORDER BY listen_count DESC
        `)).slice(0, limit);

        const totalStatsRows = extractRows(await client.query(`
            SELECT
                COUNT(*) as total_listens,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT details->>'bookId') as unique_books,
                COUNT(CASE WHEN details->>'isAudioOnly' = 'true' THEN 1 END) as audio_only_listens
            FROM system_logs
            WHERE source = 'audio-book'
                AND message = '[audio-play]'
                AND level = 'info'
                AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION}
                AND ${maintenanceIpFilter}
                ${daysFilter}
        `));

        return NextResponse.json({
            listensOverTime: listensOverTimeRows,
            mostListenedBooks: mostListenedBooksRows,
            topListeners: topListenersRows,
            totalStats: totalStatsRows[0] || {
                total_listens: 0,
                unique_users: 0,
                unique_books: 0,
                audio_only_listens: 0,
            },
        });
    } catch (error) {
        return handleApiError(error, 'Failed to fetch audio listen statistics');
    }
}
