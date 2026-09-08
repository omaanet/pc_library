import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    allowedDevOrigins: ['127.0.0.1', '192.168.1.3'],
    // Keep jsdom's runtime assets relative to its installed package during SSR.
    serverExternalPackages: ['isomorphic-dompurify'],
    experimental: {
        // Next 16.2.6's persistent dev cache caused repeated output invalidations
        // on Windows (sustained CPU and growing RAM). Keep Turbopack in memory.
        turbopackFileSystemCacheForDev: false,
    },
    // The admin migrations API reads .sql files from scripts/migrations at runtime
    // via fs (process.cwd()). Next's static tracing can't detect those dynamic
    // reads, so include them explicitly to survive a standalone/serverless build.
    outputFileTracingIncludes: {
        '/api/admin/migrations/**': ['./scripts/migrations/**/*'],
        '/api/preview-assets/**': [
            './public/covers/copertina-la-ragazza-del-carillon.jpg',
            './public/previews/covers/10879c1e-7b15-4a79-9d69-afcc729d7968.webp',
            './public/previews/covers/3df800bd-9438-49e9-ac2d-3778fd56f85a.webp',
            './public/previews/covers/f871964d-6ca4-4220-8069-5033c22e9584.webp',
            './public/previews/book-1746324080859/pages/page-01-or8-57ecb88b-ab5a-4fbf-a781-f7594093d8f7.png',
        ],
    },
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
