import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        unoptimized: true, // Disables Next.js image optimization
        dangerouslyAllowSVG: true, // Enable if you use SVGs
        contentDispositionType: 'inline', // Ensures images display instead of downloading
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Optional CSP security settings
    },
    // Remove only console.log statements in production builds
    // Keep error, warn, info, debug, and trace for important diagnostics
    compiler: {
        removeConsole:
            process.env.NODE_ENV === 'production'
                ? { exclude: ['error', 'warn', 'info', 'debug', 'trace'] }
                : false,
    },
    async headers() {
        return [
            {
                // Security headers for cover image API routes
                // These headers are applied to all responses from /api/covers/:path*
                source: "/api/covers/:path*",
                headers: [
                    {
                        // Content Security Policy: Restricts what resources can be loaded
                        // - default-src 'none': Block all resources by default
                        // - img-src 'self': Allow images only from same origin
                        key: "Content-Security-Policy",
                        value: "default-src 'none'; img-src 'self'",
                    },
                    {
                        // Prevents MIME type sniffing, forcing browsers to respect declared content type
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        // Prevents the page from being displayed in frames/iframes
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        // Controls how much referrer information is sent with requests
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        // Ensures images display inline in browser rather than downloading
                        key: "Content-Disposition",
                        value: "inline",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
