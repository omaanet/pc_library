import { NextRequest, NextResponse } from 'next/server';
import { isAdminRole, ADMIN_ROLES } from '@/config/admin-roles';
import { requireSuperAdmin } from '@/lib/admin-auth';
import { ApiError, handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { getFirstRow, getNeonClient } from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withCSRFProtection(async function PATCH(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const actor = await requireSuperAdmin();
        const { id } = await params;
        const targetId = Number(id);
        if (!Number.isInteger(targetId) || targetId <= 0) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid user id');
        }
        if (targetId === actor.id) {
            throw new ApiError(HttpStatus.FORBIDDEN, 'You cannot change your own role');
        }

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid JSON body');
        }
        const userLevel = (body as { userLevel?: unknown } | null)?.userLevel;
        if (!isAdminRole(userLevel)) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid user level');
        }

        const client = getNeonClient();
        const target = getFirstRow<{ id: number }>(
            await client.query('SELECT id FROM users WHERE id = $1', [targetId])
        );
        if (!target) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
        }

        // The advisory lock serializes all role changes before the super-admin count is read.
        const updatedUser = getFirstRow(await client.query(
            `WITH role_lock AS MATERIALIZED (
                SELECT pg_advisory_xact_lock(732194611)
             ), super_admins AS MATERIALIZED (
                SELECT COUNT(*) AS total
                FROM users
                CROSS JOIN role_lock
                WHERE is_admin >= ${ADMIN_ROLES.SUPER_ADMIN}
             )
             UPDATE users
             SET is_admin = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
               AND NOT (
                   is_admin >= ${ADMIN_ROLES.SUPER_ADMIN}
                   AND $2 <> ${ADMIN_ROLES.SUPER_ADMIN}
                   AND (SELECT total FROM super_admins) <= 1
               )
             RETURNING
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
                updated_at AS "updatedAt"`,
            [targetId, userLevel]
        ));

        if (!updatedUser) {
            throw new ApiError(HttpStatus.CONFLICT, 'The last super admin cannot be demoted');
        }

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error('[User Role API] Error:', error);
        return handleApiError(error, 'Impossibile aggiornare il ruolo', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});
