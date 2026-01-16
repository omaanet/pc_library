import { NextRequest, NextResponse } from 'next/server';
import { validateCsrfToken, requiresCsrfProtection } from './csrf';

/**
 * Middleware to add CSRF protection to API routes
 */
export function withCSRFProtection(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
        // Only validate CSRF for state-changing methods
        if (requiresCsrfProtection(request.method)) {
            // Skip CSRF for auth endpoints that don't have sessions yet
            const isAuthEndpoint = request.nextUrl.pathname.startsWith('/api/auth/');
            const isLoginOrRegister = isAuthEndpoint && 
                (request.nextUrl.pathname.includes('/login') || 
                 request.nextUrl.pathname.includes('/register') ||
                 request.nextUrl.pathname.includes('/logout'));
            
            if (!isLoginOrRegister) {
                // For non-auth endpoints, we need to validate CSRF
                // Since we're not using server-side sessions for CSRF tokens,
                // we'll rely on the client to send the token in headers
                const csrfToken = request.headers.get('x-csrf-token');
                
                if (!csrfToken) {
                    return NextResponse.json(
                        { error: 'CSRF token required' },
                        { status: 403 }
                    );
                }
                
                // TODO: In a production environment, you might want to validate
                // the token against a server-side store (Redis, database, etc.)
                // For now, we'll just check that the token exists and has reasonable length
                if (csrfToken.length < 32) {
                    return NextResponse.json(
                        { error: 'Invalid CSRF token' },
                        { status: 403 }
                    );
                }
            }
        }
        
        // Execute the handler
        return handler(request);
    };
}
