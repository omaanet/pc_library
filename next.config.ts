import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        unoptimized: true, // Disables Next.js image optimization
        dangerouslyAllowSVG: true, // Enable if you use SVGs
        contentDispositionType: 'inline', // Ensures images display instead of downloading
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Optional CSP security settings
    },
    // Configure webpack to handle EPUB files as static assets
    // webpack(config) {
    //     config.module.rules.push({
    //         test: /\.epub$/,
    //         type: 'asset/resource',
    //         generator: {
    //             filename: 'static/[path][name][ext]',
    //         },
    //     });
    //     return config;
    // },
    // Exclude EPUB files from Turbo processing using correct types
    // experimental: {
    //     turbo: {
    //         // Use resolveAlias for excluding file types
    //         resolveAlias: {
    //             // This tells Turbo to treat .epub files as external/static resources
    //             '*.epub': { type: 'static' }
    //         }
    //     },
    // },
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
            {
                source: "/epub/:path*.epub", // Add headers for EPUB API routes
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: "default-src 'self'; script-src 'self'; frame-src 'self'; sandbox allow-same-origin allow-scripts allow-popups;"
                    },
                    {
                        key: "Content-Disposition",
                        value: "attachment; filename=\"book.epub\"",
                        // value: "inline", // Ensures images display in browser
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Content-Type",
                        value: "application/epub+zip",
                    },
                    {
                        key: "Cache-Control",
                        value: "no-transform, no-store", // Prevent transformations and caching
                    },
                    {
                        key: "Transfer-Encoding",
                        value: "identity",
                    },
                    {
                        key: "Content-Encoding",
                        value: "identity", // Disable compression for these routes
                    },
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                ],
            },
            // {
            //     source: "/api/epub/:path*", // Add headers for EPUB API routes
            //     headers: [
            //         {
            //             key: "Content-Type",
            //             value: "application/epub+zip",
            //         },
            //         {
            //             key: "Cache-Control",
            //             value: "no-transform", // Prevent transformations by CDNs or proxies
            //         },
            //         {
            //             key: "Content-Encoding",
            //             value: "identity", // Disable compression for these routes
            //         },
            //     ],
            // },
        ];
    },
};

export default nextConfig;
