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

        // Get daily active users
        const dailyActiveUsersQuery = ` 
            SELECT 
                DATE(created_at) as date,
                COUNT(DISTINCT user_id) as daily_active_users,
                COUNT(*) as total_actions
            FROM system_logs 
            WHERE level = 'info'
                AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION}
                ${daysFilter}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;

        const dailyActiveUsers = await client.query(dailyActiveUsersQuery);
        const dailyActiveUsersRows = extractRows(dailyActiveUsers);

        // Get most active users by total actions
        const mostActiveUsersQuery = `
            SELECT 
                u.full_name,
                u.email,
                u.created_at as user_since,
                COUNT(*) as total_actions,
                COUNT(DISTINCT DATE(sl.created_at)) as active_days,
                COUNT(DISTINCT CASE WHEN sl.source = 'download-book' THEN details->>'bookId' END) as books_downloaded,
                COUNT(DISTINCT CASE WHEN sl.message = '[read-book]' THEN details->>'bookId' END) as books_read
            FROM system_logs sl
            JOIN users u ON sl.user_id = u.id
            WHERE sl.level = 'info'
                AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION.replace(/ip_address/g, 'sl.ip_address')}
                ${daysFilter.replace('created_at', 'sl.created_at')}
            GROUP BY u.id, u.full_name, u.email, u.created_at
            ORDER BY total_actions DESC
        `;

        const mostActiveUsers = await client.query(mostActiveUsersQuery);
        const mostActiveUsersRows = extractRows(mostActiveUsers).slice(0, limit);

        // Get user activity breakdown by type
        const activityByTypeQuery = `
            SELECT 
                CASE 
                    WHEN source = 'download-book' THEN 'Downloads'
                    WHEN message = '[read-book]' THEN 'Reading Sessions'
                    ELSE 'Other'
                END as activity_type,
                COUNT(*) as count,
                COUNT(DISTINCT user_id) as unique_users,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
            FROM system_logs 
            WHERE level = 'info'
                AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION}
                ${daysFilter}
            GROUP BY activity_type
            ORDER BY count DESC
        `;

        const activityByType = await client.query(activityByTypeQuery);
        const activityByTypeRows = extractRows(activityByType);

        // Get new vs returning users
        const newVsReturningQuery = `
            SELECT 
                DATE(sl.created_at) as date,
                COUNT(DISTINCT sl.user_id) as total_users,
                COUNT(DISTINCT CASE WHEN u.created_at >= sl.created_at - INTERVAL '7 days' THEN sl.user_id END) as new_users,
                COUNT(DISTINCT CASE WHEN u.created_at < sl.created_at - INTERVAL '7 days' THEN sl.user_id END) as returning_users
            FROM system_logs sl
            JOIN users u ON sl.user_id = u.id
            WHERE sl.level = 'info'
                AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION.replace(/ip_address/g, 'sl.ip_address')}
                ${daysFilter.replace('created_at', 'sl.created_at')}
            GROUP BY DATE(sl.created_at)
            ORDER BY date DESC
        `;

        const newVsReturning = await client.query(newVsReturningQuery);
        const newVsReturningRows = extractRows(newVsReturning);

        // Get user engagement distribution
        const engagementDistributionQuery = `
            SELECT 
                engagement_level,
                COUNT(*) as user_count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
            FROM (
                SELECT 
                    u.id,
                    CASE 
                        WHEN COUNT(*) >= 50 THEN 'Power Users'
                        WHEN COUNT(*) >= 20 THEN 'Active Users'
                        WHEN COUNT(*) >= 5 THEN 'Moderate Users'
                        ELSE 'Light Users'
                    END as engagement_level
                FROM system_logs sl
                JOIN users u ON sl.user_id = u.id
                WHERE sl.level = 'info'
                    AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION.replace(/ip_address/g, 'sl.ip_address')}
                    ${daysFilter.replace('created_at', 'sl.created_at')}
                GROUP BY u.id
            ) user_engagement
            GROUP BY engagement_level
            ORDER BY 
                CASE engagement_level
                    WHEN 'Power Users' THEN 1
                    WHEN 'Active Users' THEN 2
                    WHEN 'Moderate Users' THEN 3
                    ELSE 4
                END
        `;

        const engagementDistribution = await client.query(engagementDistributionQuery);
        const engagementDistributionRows = extractRows(engagementDistribution);

        // Get overall activity stats
        const overallStatsQuery = `
            SELECT 
                COUNT(DISTINCT user_id) as unique_active_users,
                COUNT(*) as total_actions,
                COUNT(DISTINCT DATE(created_at)) as active_days,
                ROUND(COUNT(*)::decimal / COUNT(DISTINCT user_id), 2) as avg_actions_per_user
            FROM system_logs 
            WHERE level = 'info'
                AND ${SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION}
                ${daysFilter}
        `;

        const overallStats = await client.query(overallStatsQuery);
        const overallStatsRow = extractRows(overallStats)[0] || {
            unique_active_users: 0,
            total_actions: 0,
            active_days: 0,
            avg_actions_per_user: 0
        };

        return NextResponse.json({
            dailyActiveUsers: dailyActiveUsersRows,
            mostActiveUsers: mostActiveUsersRows,
            activityByType: activityByTypeRows,
            newVsReturning: newVsReturningRows,
            engagementDistribution: engagementDistributionRows,
            overallStats: overallStatsRow
        });
    } catch (error) {
        return handleApiError(error, 'Failed to fetch user activity statistics');
    }
}
