import { NextResponse } from 'next/server';
import { getNeonClient, extractRows } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: Request) {
    try {
        // Require admin authorization
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const daysParam = searchParams.get('days') || '30';
        const limit = parseInt(searchParams.get('limit') || '10');
        
        // Handle 'all' days parameter
        const daysFilter = daysParam === 'all' ? '' : `AND created_at >= NOW() - INTERVAL '${daysParam} days'`;

        const client = getNeonClient();

        // Get reading sessions over time
        const sessionsOverTimeQuery = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as sessions_count,
                COUNT(DISTINCT user_id) as unique_readers,
                COUNT(DISTINCT details->>'bookId') as unique_books_read
            FROM system_logs 
            WHERE message = '[read-book]' 
                AND level = 'info'
                ${daysFilter}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;

        const sessionsOverTime = await client.query(sessionsOverTimeQuery);
        const sessionsOverTimeRows = extractRows(sessionsOverTime);

        // Get most read books
        const mostReadBooksQuery = `
            SELECT 
                COALESCE(details->>'bookTitle', 'Unknown') as book_title,
                COALESCE(details->>'bookId', 'unknown') as book_id,
                COUNT(*) as read_sessions,
                COUNT(DISTINCT user_id) as unique_readers
            FROM system_logs 
            WHERE message = '[read-book]' 
                AND level = 'info'
                ${daysFilter}
            GROUP BY details->>'bookTitle', details->>'bookId'
            ORDER BY read_sessions DESC
            LIMIT $1
        `;

        const mostReadBooks = await client.query(mostReadBooksQuery, [limit]);
        const mostReadBooksRows = extractRows(mostReadBooks);

        // Get top readers by session count
        const topReadersQuery = `
            SELECT 
                u.full_name,
                u.email,
                COUNT(*) as reading_sessions,
                COUNT(DISTINCT details->>'bookId') as unique_books_read
            FROM system_logs sl
            JOIN users u ON sl.user_id = u.id
            WHERE sl.message = '[read-book]' 
                AND sl.level = 'info'
                ${daysFilter.replace('created_at', 'sl.created_at')}
            GROUP BY u.id, u.full_name, u.email
            ORDER BY reading_sessions DESC
            LIMIT $1
        `;

        const topReaders = await client.query(topReadersQuery, [limit]);
        const topReadersRows = extractRows(topReaders);

        // Get reading session patterns by hour
        const sessionsByHourQuery = `
            SELECT 
                EXTRACT(HOUR FROM created_at) as hour_of_day,
                COUNT(*) as sessions_count,
                COUNT(DISTINCT user_id) as unique_readers
            FROM system_logs 
            WHERE message = '[read-book]' 
                AND level = 'info'
                ${daysFilter}
            GROUP BY EXTRACT(HOUR FROM created_at)
            ORDER BY hour_of_day
        `;

        const sessionsByHour = await client.query(sessionsByHourQuery);
        const sessionsByHourRows = extractRows(sessionsByHour);

        // Get total reading stats
        const totalStatsQuery = `
            SELECT 
                COUNT(*) as total_sessions,
                COUNT(DISTINCT user_id) as unique_readers,
                COUNT(DISTINCT details->>'bookId') as unique_books_read,
                (SELECT AVG(session_count)
                 FROM (
                     SELECT COUNT(*) as session_count
                     FROM system_logs 
                     WHERE message = '[read-book]' 
                         AND level = 'info'
                         ${daysFilter}
                     GROUP BY user_id
                 ) user_sessions
                ) as avg_sessions_per_user
            FROM system_logs 
            WHERE message = '[read-book]' 
                AND level = 'info'
                ${daysFilter}
        `;

        const totalStats = await client.query(totalStatsQuery);
        const totalStatsRow = extractRows(totalStats)[0] || {
            total_sessions: 0,
            unique_readers: 0,
            unique_books_read: 0,
            avg_sessions_per_user: 0
        };

        return NextResponse.json({
            sessionsOverTime: sessionsOverTimeRows,
            mostReadBooks: mostReadBooksRows,
            topReaders: topReadersRows,
            sessionsByHour: sessionsByHourRows,
            totalStats: totalStatsRow
        });
    } catch (error) {
        return handleApiError(error, 'Failed to fetch reading session statistics');
    }
}
