// src/lib/csrf.ts
// CSRF (Cross-Site Request Forgery) protection utilities

import crypto from 'crypto';
import { NextRequest } from 'next/server';

/**
 * Generate a cryptographically secure CSRF token
 * @returns A random 32-byte token as a hex string
 */
export function generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token from request headers against session token
 *
 * @param request - Next.js request object
 * @param sessionToken - Expected CSRF token from user's session
 * @returns true if valid, false otherwise
 *
 * @example
 * const isValid = validateCsrfToken(request, user.csrfToken);
 */
export function validateCsrfToken(request: NextRequest, sessionToken: string): boolean {
    // Get token from header (prioritized)
    const headerToken = request.headers.get('x-csrf-token');

    if (!headerToken || !sessionToken) {
        return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(headerToken),
        Buffer.from(sessionToken)
    );
}

/**
 * Check if a request method requires CSRF protection
 *
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @returns true if method is state-changing and requires CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
    const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    return protectedMethods.includes(method.toUpperCase());
}

/**
 * Extract CSRF token from request (header or body)
 *
 * @param request - Next.js request object
 * @returns CSRF token string or null if not found
 */
export function extractCsrfToken(request: NextRequest): string | null {
    // Try header first (recommended)
    const headerToken = request.headers.get('x-csrf-token');
    if (headerToken) {
        return headerToken;
    }

    // Could also check request body or query params as fallback
    // (not implemented here to keep headers as the primary mechanism)

    return null;
}
