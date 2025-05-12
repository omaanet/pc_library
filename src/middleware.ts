// src/middleware.ts
import { type NextRequest, NextResponse } from 'next/server';

const COVERS_PATH = '/api/covers';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
    '/profile',
    '/settings',
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
            // Parse the session cookie
            const sessionData = JSON.parse(
                Buffer.from(session.value, 'base64').toString('utf-8')
            ) as { userId: string; expires: string };

            // Check if session has expired
            if (new Date(sessionData.expires) < new Date()) {
                sessionExpired = true;
            } else {
                isAuthenticated = true;
            }
        } catch (error) {
            // Invalid session format, consider not authenticated
            console.error('Session parse error:', error);
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
        // '/library/my-books/:path*',
        // Specific protected routes
        '/profile',
        '/settings',
    ],
};