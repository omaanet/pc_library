// src/middleware.ts
import { type NextRequest, NextResponse } from 'next/server';

const COVERS_PATH = '/api/covers';

// Security headers for image responses
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'none'; img-src 'self'",
};

export async function middleware(request: NextRequest) {
    // Only intercept cover image requests
    if (!request.nextUrl.pathname.startsWith(COVERS_PATH)) {
        return NextResponse.next();
    }

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

export const config = {
    matcher: '/api/covers/:path*',
};