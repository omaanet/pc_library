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

        // Get errors over time
        const errorsOverTimeQuery = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_errors,
                COUNT(CASE WHEN level = 'error' THEN 1 END) as errors,
                COUNT(CASE WHEN level = 'warning' THEN 1 END) as warnings,
                COUNT(DISTINCT user_id) as affected_users
            FROM system_logs 
            WHERE level IN ('error', 'warning')
                ${daysFilter}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;

        const errorsOverTime = await client.query(errorsOverTimeQuery);
        const errorsOverTimeRows = extractRows(errorsOverTime);

        // Get top error sources
        const topErrorSourcesQuery = `
            SELECT 
                source,
                COUNT(*) as error_count,
                COUNT(CASE WHEN level = 'error' THEN 1 END) as errors,
                COUNT(CASE WHEN level = 'warning' THEN 1 END) as warnings,
                COUNT(DISTINCT user_id) as affected_users,
                STRING_AGG(DISTINCT message, ', ') as common_messages
            FROM system_logs 
            WHERE level IN ('error', 'warning')
                ${daysFilter}
            GROUP BY source
            ORDER BY error_count DESC
            LIMIT $1
        `;

        const topErrorSources = await client.query(topErrorSourcesQuery, [limit]);
        const topErrorSourcesRows = extractRows(topErrorSources);

        // Get most frequent error messages
        const frequentErrorsQuery = `
            SELECT 
                message,
                source,
                COUNT(*) as occurrence_count,
                COUNT(DISTINCT user_id) as affected_users,
                MIN(created_at) as first_occurrence,
                MAX(created_at) as last_occurrence
            FROM system_logs 
            WHERE level IN ('error', 'warning')
                ${daysFilter}
            GROUP BY message, source
            ORDER BY occurrence_count DESC
            LIMIT $1
        `;

        const frequentErrors = await client.query(frequentErrorsQuery, [limit]);
        const frequentErrorsRows = extractRows(frequentErrors);

        // Get errors by request path
        const errorsByPathQuery = `
            SELECT 
                request_path,
                COUNT(*) as error_count,
                COUNT(CASE WHEN level = 'error' THEN 1 END) as errors,
                COUNT(CASE WHEN level = 'warning' THEN 1 END) as warnings,
                COUNT(DISTINCT user_id) as affected_users,
                COUNT(DISTINCT source) as error_sources
            FROM system_logs 
            WHERE level IN ('error', 'warning')
                AND request_path IS NOT NULL
                ${daysFilter}
            GROUP BY request_path
            ORDER BY error_count DESC
            LIMIT $1
        `;

        const errorsByPath = await client.query(errorsByPathQuery, [limit]);
        const errorsByPathRows = extractRows(errorsByPath);

        // Get error distribution by hour
        const errorsByHourQuery = `
            SELECT 
                EXTRACT(HOUR FROM created_at) as hour_of_day,
                COUNT(*) as error_count,
                COUNT(CASE WHEN level = 'error' THEN 1 END) as errors,
                COUNT(CASE WHEN level = 'warning' THEN 1 END) as warnings
            FROM system_logs 
            WHERE level IN ('error', 'warning')
                ${daysFilter}
            GROUP BY EXTRACT(HOUR FROM created_at)
            ORDER BY hour_of_day
        `;

        const errorsByHour = await client.query(errorsByHourQuery);
        const errorsByHourRows = extractRows(errorsByHour);

        // Get overall error stats
        const overallStatsQuery = `
            SELECT 
                COUNT(*) as total_errors,
                COUNT(CASE WHEN level = 'error' THEN 1 END) as errors,
                COUNT(CASE WHEN level = 'warning' THEN 1 END) as warnings,
                COUNT(DISTINCT source) as unique_sources,
                COUNT(DISTINCT user_id) as affected_users,
                ROUND(COUNT(CASE WHEN level = 'error' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as error_percentage
            FROM system_logs 
            WHERE level IN ('error', 'warning')
                ${daysFilter}
        `;

        const overallStats = await client.query(overallStatsQuery);
        const overallStatsRow = extractRows(overallStats)[0] || {
            total_errors: 0,
            errors: 0,
            warnings: 0,
            unique_sources: 0,
            affected_users: 0,
            error_percentage: 0
        };

        return NextResponse.json({
            errorsOverTime: errorsOverTimeRows,
            topErrorSources: topErrorSourcesRows,
            frequentErrors: frequentErrorsRows,
            errorsByPath: errorsByPathRows,
            errorsByHour: errorsByHourRows,
            overallStats: overallStatsRow
        });
    } catch (error) {
        return handleApiError(error, 'Failed to fetch error statistics');
    }
}
