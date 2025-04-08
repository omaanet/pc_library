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
                source: "/api/covers/:path*", // Match API paths serving images
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: "default-src 'self'; script-src 'none'; sandbox;",
                    },
                    {
                        key: "Content-Disposition",
                        value: "inline", // Ensures images display in browser
                    },
                ],
            },
            {
                source: "/epub/:path*.epub", // Add headers for EPUB API routes
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: "default-src 'self'; script-src 'none'; frame-src 'self'; sandbox allow-same-origin allow-scripts allow-popups;",
                    },
                    {
                        key: "Content-Disposition",
                        value: "inline", // Ensures images display in browser
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
