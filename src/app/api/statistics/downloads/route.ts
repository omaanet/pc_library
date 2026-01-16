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

        // Get download analytics over time
        const downloadsOverTimeQuery = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as downloads_count,
                COUNT(DISTINCT user_id) as unique_users
            FROM system_logs 
            WHERE source = 'download-book' 
                AND level = 'info'
                ${daysFilter}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;

        const downloadsOverTime = await client.query(downloadsOverTimeQuery);
        const downloadsOverTimeRows = extractRows(downloadsOverTime);

        // Get most downloaded books
        const mostDownloadedBooksQuery = `
            SELECT 
                COALESCE(details->>'bookTitle', 'Unknown') as book_title,
                COALESCE(details->>'bookId', 'unknown') as book_id,
                COUNT(*) as download_count,
                COUNT(DISTINCT user_id) as unique_downloaders,
                AVG(CASE WHEN details->>'fileSize' ~ '^[0-9]+$' THEN (details->>'fileSize')::bigint ELSE NULL END) as avg_file_size
            FROM system_logs 
            WHERE source = 'download-book' 
                AND level = 'info'
                ${daysFilter}
            GROUP BY details->>'bookTitle', details->>'bookId'
            ORDER BY download_count DESC
            LIMIT $1
        `;

        const mostDownloadedBooks = await client.query(mostDownloadedBooksQuery, [limit]);
        const mostDownloadedBooksRows = extractRows(mostDownloadedBooks);

        // Get top downloaders
        const topDownloadersQuery = `
            SELECT 
                u.full_name,
                u.email,
                COUNT(*) as download_count,
                COUNT(DISTINCT details->>'bookId') as unique_books
            FROM system_logs sl
            JOIN users u ON sl.user_id = u.id
            WHERE sl.source = 'download-book' 
                AND sl.level = 'info'
                ${daysFilter.replace('created_at', 'sl.created_at')}
            GROUP BY u.id, u.full_name, u.email
            ORDER BY download_count DESC
            LIMIT $1
        `;

        const topDownloaders = await client.query(topDownloadersQuery, [limit]);
        const topDownloadersRows = extractRows(topDownloaders);

        // Get total downloads stats
        const totalStatsQuery = `
            SELECT 
                COUNT(*) as total_downloads,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT details->>'bookId') as unique_books,
                SUM(CASE WHEN details->>'fileSize' ~ '^[0-9]+$' THEN (details->>'fileSize')::bigint ELSE 0 END) as total_bytes_downloaded
            FROM system_logs 
            WHERE source = 'download-book' 
                AND level = 'info'
                ${daysFilter}
        `;

        const totalStats = await client.query(totalStatsQuery);
        const totalStatsRow = extractRows(totalStats)[0] || {
            total_downloads: 0,
            unique_users: 0,
            unique_books: 0,
            total_bytes_downloaded: 0
        };

        return NextResponse.json({
            downloadsOverTime: downloadsOverTimeRows,
            mostDownloadedBooks: mostDownloadedBooksRows,
            topDownloaders: topDownloadersRows,
            totalStats: totalStatsRow
        });
    } catch (error) {
        return handleApiError(error, 'Failed to fetch download statistics');
    }
}
