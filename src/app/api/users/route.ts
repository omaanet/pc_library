import { NextResponse } from 'next/server';
import { getNeonClient } from '@/lib/db';
import { SITE_CONFIG } from '@/config/site-config';
import { requireAdmin } from '@/lib/admin-auth';
import { handleApiError } from '@/lib/api-error-handler';

export interface UsersQueryParams {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: 'email' | 'fullName' | 'isActivated' | 'isAdmin' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    isActivated?: boolean;
    isAdmin?: boolean;
}

export async function GET(request: Request) {
    console.log('[Users API] Request received');
    try {
        // Require admin authorization
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || String(SITE_CONFIG.PAGINATION.DEFAULT_PAGE));
        let perPage = parseInt(searchParams.get('perPage') || String(SITE_CONFIG.PAGINATION.DEFAULT_PER_PAGE));
        
        // Validate perPage is within allowed range
        if (perPage < SITE_CONFIG.PAGINATION.MIN_PER_PAGE) {
            perPage = SITE_CONFIG.PAGINATION.MIN_PER_PAGE;
        } else if (perPage > SITE_CONFIG.PAGINATION.MAX_PER_PAGE) {
            perPage = SITE_CONFIG.PAGINATION.MAX_PER_PAGE;
        }
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') as UsersQueryParams['sortBy'] || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';
        const isActivated = searchParams.get('isActivated');
        const isAdmin = searchParams.get('isAdmin');

        console.log('[Users API] Query params:', {
            page,
            perPage,
            search,
            sortBy,
            sortOrder,
            isActivated,
            isAdmin
        });

        const client = getNeonClient();
        console.log('[Users API] Database client initialized');

        // Build WHERE conditions
        const whereConditions: string[] = [];
        const params: (string | boolean | number)[] = [];
        let paramIndex = 1;

        if (search) {
            whereConditions.push(`(LOWER(email) LIKE LOWER($${paramIndex}) OR LOWER(full_name) LIKE LOWER($${paramIndex}))`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (isActivated !== null) {
            const isActivatedBool = isActivated === 'true';
            whereConditions.push(`is_activated = $${paramIndex}::boolean`);
            params.push(isActivatedBool);
            paramIndex++;
        }

        if (isAdmin !== null) {
            // Handle both string 'true'/'false' and boolean values
            const isAdminBool = isAdmin === 'true';
            whereConditions.push(`is_admin = $${paramIndex}::integer`);
            params.push(isAdminBool ? 1 : 0);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
        console.log('[Users API] Count query:', countQuery, 'Params:', params);

        const countResult = await client.query(countQuery, params);
        console.log('[Users API] Count result:', countResult);

        const total = parseInt(countResult[0]?.total || '0');
        console.log('[Users API] Total users:', total);

        // Get paginated users
        const offset = (page - 1) * perPage;

        // Map sortBy to actual column names
        const sortColumnMap: Record<string, string> = {
            email: 'email',
            fullName: 'full_name',
            isActivated: 'is_activated',
            isAdmin: 'is_admin',
            createdAt: 'created_at'
        };

        const orderBy = sortColumnMap[sortBy] || 'created_at';

        // Validate sortOrder to prevent SQL injection
        const validSortOrders = ['asc', 'desc'];
        const safeSortOrder = validSortOrders.includes(sortOrder.toLowerCase())
            ? sortOrder.toUpperCase()
            : 'DESC';

        const query = `
      SELECT
        id,
        email,
        full_name as "fullName",
        is_activated as "isActivated",
        CASE WHEN is_admin = 1 THEN true ELSE false END as "isAdmin",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM users
      ${whereClause}
      ORDER BY ${orderBy} ${safeSortOrder} 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        console.log('[Users API] Users query:', query, 'Params:', [...params, perPage, offset]);
        const result = await client.query(query, [...params, perPage, offset]);
        console.log('[Users API] Query result rows:', result?.length || 0);

        const response = {
            users: result,
            pagination: {
                page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage)
            }
        };

        console.log('[Users API] Sending response with', result?.length || 0, 'users');
        return NextResponse.json(response);

    } catch (error) {
        console.error('[Users API] Error:', error);
        return handleApiError(error, 'Failed to fetch users', 500);
    }
}
