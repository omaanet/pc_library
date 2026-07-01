// src/proxy.ts
import { type NextRequest, NextResponse } from 'next/server';
import { APP_CONTENT_SECURITY_POLICY } from '@/lib/security/csp';
import { getManagedPage } from '@/lib/db/queries/managed-pages';
import { getBookById, getPromoPageById } from '@/lib/db';
import { getNeonClient } from '@/lib/db/client';
import { PROMO_TEMPLATES } from '@/lib/promo-page-input';

const COVERS_PATH = '/api/covers';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
    '/profile',
    '/settings',
    '/guida',
    '/read-book',
    '/add-book',
    '/admin',
];

// Auth routes (don't redirect to login page)
const AUTH_ROUTES = [
    '/login',
    '/register',
];

// Note: Security headers for cover images are configured in next.config.ts
// This proxy focuses on validation only (dimensions, path security)

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session = request.cookies.get('session');
    let isAuthenticated = false;
    let sessionExpired = false;
    let authenticatedUserId: number | null = null;

    // Check if the user is authenticated (only parse the session once)
    if (session) {
        try {
            // Parse the session cookie - decode base64 first
            let decodedSession: string;
            try {
                decodedSession = Buffer.from(session.value, 'base64').toString('utf-8');
            } catch (base64Error) {
                // Invalid base64 encoding
                console.error('Session base64 decoding failed:', {
                    error: base64Error instanceof Error ? base64Error.message : 'Unknown base64 error',
                    cookieLength: session.value.length,
                    hasInvalidChars: /[^A-Za-z0-9+/=]/.test(session.value)
                });
                return NextResponse.next(); // Continue without authentication
            }

            // Parse JSON session data
            let sessionData: { userId: string; expires: string };
            try {
                sessionData = JSON.parse(decodedSession);
            } catch (jsonError) {
                // Invalid JSON format
                console.error('Session JSON parsing failed:', {
                    error: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error',
                    decodedLength: decodedSession.length,
                    decodedPreview: decodedSession.substring(0, 100)
                });
                return NextResponse.next(); // Continue without authentication
            }

            // Validate session data structure
            if (!sessionData || typeof sessionData !== 'object') {
                console.error('Session data is not a valid object:', {
                    type: typeof sessionData,
                    value: sessionData
                });
                return NextResponse.next();
            }

            if (!sessionData.userId || !sessionData.expires) {
                console.error('Session data missing required fields:', {
                    hasUserId: !!sessionData.userId,
                    hasExpires: !!sessionData.expires,
                    availableFields: Object.keys(sessionData)
                });
                return NextResponse.next();
            }

            if (typeof sessionData.userId !== 'string' || typeof sessionData.expires !== 'string') {
                console.error('Session data has incorrect field types:', {
                    userIdType: typeof sessionData.userId,
                    expiresType: typeof sessionData.expires
                });
                return NextResponse.next();
            }

            // Check if session has expired
            let expirationDate: Date;
            try {
                expirationDate = new Date(sessionData.expires);
                if (isNaN(expirationDate.getTime())) {
                    throw new Error('Invalid date format');
                }
            } catch (dateError) {
                console.error('Session expiration date parsing failed:', {
                    error: dateError instanceof Error ? dateError.message : 'Unknown date error',
                    expiresValue: sessionData.expires
                });
                return NextResponse.next();
            }

            if (expirationDate < new Date()) {
                sessionExpired = true;
            } else {
                const parsedUserId = Number(sessionData.userId);
                if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
                    return NextResponse.next();
                }
                isAuthenticated = true;
                authenticatedUserId = parsedUserId;
            }
        } catch (error) {
            // Catch-all for any other parsing errors
            console.error('Unexpected session parsing error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            return NextResponse.next(); // Continue without authentication
        }
    }

    // 1. Handle auth routes (login, register) - redirect to home if already authenticated
    if (isAuthRoute(pathname) && isAuthenticated) {
        // Redirect authenticated users away from auth pages
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. Authentication check for protected routes
    if (isProtectedRoute(pathname)) {
        if (isPromoPreviewRoute(pathname)) {
            const canPreview = await canAccessPromoPreview(
                request,
                isAuthenticated && !sessionExpired ? authenticatedUserId : null
            );
            return canPreview ? NextResponse.next() : new NextResponse(null, { status: 404 });
        }

        // If not authenticated or session expired, redirect to login
        if (!isAuthenticated || sessionExpired) {
            const url = new URL('/login', request.url);
            // Add the original URL as a redirect parameter
            url.searchParams.set('redirect', encodeURIComponent(request.url));
            return NextResponse.redirect(url);
        }

        // Authentication successful, continue
        return NextResponse.next();
    }

    // 2. Handle cover image requests
    if (pathname.startsWith(`${COVERS_PATH}/`)) {
        // Extract path parts
        const parts = request.nextUrl.pathname
            .replace(COVERS_PATH, '')
            .split('/')
            .filter(Boolean);

        // Validate path structure (width/height/path)
        if (parts.length < 3) {
            return new NextResponse('Invalid path', { status: 400 });
        }

        // Validate dimensions
        const [width, height] = parts;
        const dimensions = {
            width: parseInt(width),
            height: parseInt(height),
        };

        if (!dimensions.width || !dimensions.height ||
            dimensions.width <= 0 || dimensions.height <= 0 ||
            dimensions.width > 2000 || dimensions.height > 2000) {
            return new NextResponse('Invalid dimensions', { status: 400 });
        }

        // Get image path
        const imagePath = parts.slice(2).join('/');

        // Validate image path
        if (imagePath === '') {
            return new NextResponse('Invalid image path', { status: 400 });
        }

        // Validation passed - allow the request to proceed to the API route
        // Security headers are applied by next.config.ts for all /api/covers/:path* responses
        return NextResponse.next();
    }

    // For all other routes, proceed normally with security headers
    const response = NextResponse.next();
    
    // Add security headers to prevent XSS and other attacks
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    response.headers.set('Content-Security-Policy', APP_CONTENT_SECURITY_POLICY);
    
    return response;
}

// Helper to check if a route needs authentication
function isProtectedRoute(pathname: string): boolean {
    return PROTECTED_ROUTES.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );
}

// Helper to check if a route is an auth route (login, register, etc.)
function isAuthRoute(pathname: string): boolean {
    return AUTH_ROUTES.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );
}

function isPromoPreviewRoute(pathname: string): boolean {
    return pathname === '/admin/promo-pages/preview' ||
        pathname.startsWith('/admin/promo-pages/preview/');
}

function parsePromoPreviewId(pathname: string): number | null {
    const match = /^\/admin\/promo-pages\/preview\/(\d+)$/.exec(pathname);
    if (!match) return null;

    const id = Number(match[1]);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function isValidPreviewDate(value: string): boolean {
    const trimmed = value.trim();
    if (trimmed.length === 0) return true;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;
}

function validatePromoPreviewSearchParams(
    searchParams: URLSearchParams,
    savedBookId: string
): string | null {
    let bookId = savedBookId;

    const draftBookId = searchParams.get('bookId');
    if (draftBookId !== null) {
        const trimmed = draftBookId.trim();
        if (!trimmed) return null;
        bookId = trimmed;
    }

    const audioLength = searchParams.get('audioLength');
    if (audioLength !== null && audioLength.trim().length > 0) {
        const parsed = Number(audioLength);
        if (!Number.isFinite(parsed) || parsed <= 0) return null;
    }

    const isActive = searchParams.get('isActive');
    if (isActive !== null && isActive !== 'true' && isActive !== 'false') {
        return null;
    }

    const template = searchParams.get('template');
    if (template !== null && !(PROMO_TEMPLATES as readonly string[]).includes(template)) {
        return null;
    }

    const publishingDateOverride = searchParams.get('publishingDateOverride');
    if (publishingDateOverride !== null && !isValidPreviewDate(publishingDateOverride)) {
        return null;
    }

    return bookId;
}

async function getUserLevel(userId: number): Promise<number | null> {
    const result = await getNeonClient().query<{ userLevel: number }>(
        'SELECT is_admin AS "userLevel" FROM users WHERE id = $1',
        [userId]
    );
    if (!Array.isArray(result) || result.length === 0) return null;

    return Number(result[0].userLevel);
}

async function canAccessPromoPreview(request: NextRequest, userId: number | null): Promise<boolean> {
    if (!userId) return false;

    try {
        const id = parsePromoPreviewId(request.nextUrl.pathname);
        if (!id) return false;

        const [userLevel, promoPage, promoPageConfig] = await Promise.all([
            getUserLevel(userId),
            getPromoPageById(id),
            getManagedPage('promo-pages'),
        ]);
        if (userLevel === null || userLevel < promoPageConfig.accessLevel || !promoPage) {
            return false;
        }

        const bookId = validatePromoPreviewSearchParams(request.nextUrl.searchParams, promoPage.bookId);
        if (!bookId) return false;

        return Boolean(await getBookById(bookId));
    } catch {
        return false;
    }
}

export const config = {
    matcher: [
        // Apply to all paths except for static files and API routes that don't need headers
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
