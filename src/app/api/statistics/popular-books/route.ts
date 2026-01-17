import { NextResponse } from 'next/server';
import { getNeonClient, extractRows } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { handleApiError } from '@/lib/api-error-handler';
import { SITE_CONFIG } from '@/config/site-config';

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

        // Get books by downloads
        const booksByDownloadsQuery = ` 
            SELECT 
                COALESCE(details->>'bookTitle', 'Unknown') as book_title,
                COALESCE(details->>'bookId', 'unknown') as book_id,
                COUNT(*) as download_count,
                COUNT(DISTINCT user_id) as unique_downloaders,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as download_percentage
            FROM system_logs 
            WHERE source = 'download-book' 
                AND level = 'info'
                AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION}
                ${daysFilter}
            GROUP BY details->>'bookTitle', details->>'bookId'
            ORDER BY download_count DESC
        `;

        const booksByDownloads = await client.query(booksByDownloadsQuery);
        const booksByDownloadsRows = extractRows(booksByDownloads).slice(0, limit);

        // Get books by reading sessions
        const booksByReadsQuery = `
            SELECT 
                COALESCE(details->>'bookTitle', 'Unknown') as book_title,
                COALESCE(details->>'bookId', 'unknown') as book_id,
                COUNT(*) as read_sessions,
                COUNT(DISTINCT user_id) as unique_readers,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as read_percentage
            FROM system_logs 
            WHERE message = '[read-book]' 
                AND level = 'info'
                AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION}
                ${daysFilter}
            GROUP BY details->>'bookTitle', details->>'bookId'
            ORDER BY read_sessions DESC
        `;

        const booksByReads = await client.query(booksByReadsQuery);
        const booksByReadsRows = extractRows(booksByReads).slice(0, limit);

        // Get combined engagement score
        const combinedEngagementQuery = `
            SELECT 
                COALESCE(d.book_title, r.book_title) as book_title,
                COALESCE(d.book_id, r.book_id) as book_id,
                COALESCE(d.download_count, 0) as download_count,
                COALESCE(d.unique_downloaders, 0) as unique_downloaders,
                COALESCE(r.read_sessions, 0) as read_sessions,
                COALESCE(r.unique_readers, 0) as unique_readers,
                COALESCE(d.download_count, 0) * 2 + COALESCE(r.read_sessions, 0) as engagement_score
            FROM (
                SELECT 
                    COALESCE(details->>'bookTitle', 'Unknown') as book_title,
                    COALESCE(details->>'bookId', 'unknown') as book_id,
                    COUNT(*) as download_count,
                    COUNT(DISTINCT user_id) as unique_downloaders
                FROM system_logs 
                WHERE source = 'download-book' 
                    AND level = 'info'
                    AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION}
                    ${daysFilter}
                GROUP BY details->>'bookTitle', details->>'bookId'
            ) d
            FULL OUTER JOIN (
                SELECT 
                    COALESCE(details->>'bookTitle', 'Unknown') as book_title,
                    COALESCE(details->>'bookId', 'unknown') as book_id,
                    COUNT(*) as read_sessions,
                    COUNT(DISTINCT user_id) as unique_readers
                FROM system_logs 
                WHERE message = '[read-book]' 
                    AND level = 'info'
                    AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION}
                    ${daysFilter}
                GROUP BY details->>'bookTitle', details->>'bookId'
            ) r ON d.book_id = r.book_id
            ORDER BY engagement_score DESC
        `;

        const combinedEngagement = await client.query(combinedEngagementQuery);
        const combinedEngagementRows = extractRows(combinedEngagement).slice(0, limit);

        // Get book access trends over time
        const accessTrendsQuery = `
            SELECT 
                DATE(created_at) as date,
                COUNT(DISTINCT CASE WHEN source = 'download-book' THEN details->>'bookId' END) as books_downloaded,
                COUNT(DISTINCT CASE WHEN message = '[read-book]' THEN details->>'bookId' END) as books_read
            FROM system_logs 
            WHERE (source = 'download-book' OR message = '[read-book]')
                AND level = 'info'
                AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION}
                ${daysFilter}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;

        const accessTrends = await client.query(accessTrendsQuery);
        const accessTrendsRows = extractRows(accessTrends);

        return NextResponse.json({
            booksByDownloads: booksByDownloadsRows,
            booksByReads: booksByReadsRows,
            combinedEngagement: combinedEngagementRows,
            accessTrends: accessTrendsRows
        });
    } catch (error) {
        return handleApiError(error, 'Failed to fetch popular books statistics');
    }
}
