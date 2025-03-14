import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        unoptimized: true, // Disables Next.js image optimization
        dangerouslyAllowSVG: true, // Enable if you use SVGs
        contentDispositionType: 'inline', // Ensures images display instead of downloading
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Optional CSP security settings
    },
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
        ];
    },
};

export default nextConfig;
