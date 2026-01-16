// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { withCSRFProtection } from '@/lib/csrf-middleware';

export const POST = withCSRFProtection(async function() {
    try {
        // Create response for successful logout
        const response = NextResponse.json({
            success: true,
            message: 'Logout successful'
        });

        // Clear session cookie by setting expiry in the past
        const isSecure = process.env.NODE_ENV === 'production';
        response.headers.set(
            'Set-Cookie',
            `session=; Path=/; HttpOnly; SameSite=Strict; ${isSecure ? 'Secure;' : ''} Max-Age=0`
        );

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return handleApiError(error, 'Logout failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});