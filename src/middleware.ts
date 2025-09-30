// src/middleware.ts
import { type NextRequest, NextResponse } from 'next/server';

const COVERS_PATH = '/api/covers';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
    '/profile',
    '/settings',
    '/read-book',
];

// Auth routes (don't redirect to login page)
const AUTH_ROUTES = [
    '/login',
    '/register',
    '/activate',
];

// Security headers for image responses
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'none'; img-src 'self'",
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session = request.cookies.get('session');
    let isAuthenticated = false;
    let sessionExpired = false;

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
                isAuthenticated = true;
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
    if (pathname.startsWith(COVERS_PATH)) {
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

        // Allow the request to proceed
        const response = NextResponse.next();

        // Add security headers
        Object.entries(securityHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });

        return response;
    }

    // For all other routes, proceed normally
    return NextResponse.next();
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

export const config = {
    matcher: [
        // Cover image routes
        '/api/covers/:path*',
        // Auth routes
        '/activate/:path*',
        // Protected routes
        '/profile/:path*',
        '/settings/:path*',
        '/read-book/:path*',
        // '/library/my-books/:path*',
        // Specific protected routes
        '/profile',
        '/settings',
        '/read-book',
    ],
};