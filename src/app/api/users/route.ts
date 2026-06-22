import { NextResponse } from 'next/server';
import { ADMIN_ROLES, isAdminRole, type AdminRole } from '@/config/admin-roles';
import { getNeonClient, extractRows, getFirstRow } from '@/lib/db';
import { requireManagedPageAccess } from '@/lib/admin-auth';
import { ApiError, handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { SITE_CONFIG } from '@/config/site-config';

type SortField = 'email' | 'fullName' | 'isActivated' | 'userLevel' | 'createdAt';

const SORT_COLUMNS: Record<SortField, string> = {
    email: 'email',
    fullName: 'full_name',
    isActivated: 'is_activated',
    userLevel: 'is_admin',
    createdAt: 'created_at',
};

function parsePositiveInteger(value: string | null, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
    try {
        await requireManagedPageAccess('users');

        const { searchParams } = new URL(request.url);
        const page = parsePositiveInteger(searchParams.get('page'), SITE_CONFIG.PAGINATION.DEFAULT_PAGE);
        const requestedPerPage = parsePositiveInteger(
            searchParams.get('perPage'),
            SITE_CONFIG.PAGINATION.DEFAULT_PER_PAGE
        );
        const perPage = Math.min(
            SITE_CONFIG.PAGINATION.MAX_PER_PAGE,
            Math.max(SITE_CONFIG.PAGINATION.MIN_PER_PAGE, requestedPerPage)
        );
        const search = searchParams.get('search')?.trim() ?? '';
        const requestedSort = searchParams.get('sortBy') as SortField | null;
        const sortBy = requestedSort && requestedSort in SORT_COLUMNS ? requestedSort : 'userLevel';
        const requestedSortOrder = searchParams.get('sortOrder')?.toLowerCase();
        const sortOrder = requestedSortOrder === 'asc'
            ? 'ASC'
            : requestedSortOrder === 'desc'
                ? 'DESC'
                : 'DESC';
        const requestedRole = searchParams.get('userLevel');

        let userLevel: AdminRole | null = null;
        if (requestedRole !== null && requestedRole !== 'all') {
            const parsedRole = Number(requestedRole);
            if (!isAdminRole(parsedRole)) {
                throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid user level');
            }
            userLevel = parsedRole;
        }

        const conditions: string[] = [];
        const params: Array<string | number> = [];
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(email ILIKE $${params.length} OR full_name ILIKE $${params.length})`);
        }
        if (userLevel !== null) {
            params.push(userLevel);
            conditions.push(userLevel === ADMIN_ROLES.SUPER_ADMIN
                ? `is_admin >= $${params.length}`
                : `is_admin = $${params.length}`
            );
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const client = getNeonClient();
        const countRow = getFirstRow<{ total: string }>(
            await client.query(`SELECT COUNT(*) AS total FROM users ${whereClause}`, params)
        );
        const total = Number(countRow?.total ?? 0);
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        const safePage = Math.min(page, totalPages);
        const offset = (safePage - 1) * perPage;

        const users = extractRows(await client.query(
            `SELECT
                id,
                email,
                full_name AS "fullName",
                is_activated AS "isActivated",
                CASE
                    WHEN is_admin >= ${ADMIN_ROLES.SUPER_ADMIN} THEN ${ADMIN_ROLES.SUPER_ADMIN}
                    WHEN is_admin = ${ADMIN_ROLES.POWER_ADMIN} THEN ${ADMIN_ROLES.POWER_ADMIN}
                    WHEN is_admin = ${ADMIN_ROLES.ADMIN} THEN ${ADMIN_ROLES.ADMIN}
                    ELSE ${ADMIN_ROLES.REGISTERED}
                END AS "userLevel",
                CASE WHEN is_admin > ${ADMIN_ROLES.REGISTERED} THEN true ELSE false END AS "isAdmin",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
             FROM users
             ${whereClause}
             ORDER BY ${SORT_COLUMNS[sortBy]} ${sortOrder}, id ASC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, perPage, offset]
        ));

        return NextResponse.json({
            users,
            pagination: { page: safePage, perPage, total, totalPages },
        });
    } catch (error) {
        console.error('[Users API] Error:', error);
        return handleApiError(error, 'Impossibile caricare gli utenti', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
