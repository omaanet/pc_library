// src/app/layout.tsx
import type { Viewport } from 'next';
import { Providers } from '@/providers/providers';
import { Toaster } from '@/components/ui/toaster';
import { baseFont, displayFont } from '@/config/fonts';
import { metadata } from '@/config/metadata';
import { getCurrentSessionUser } from '@/lib/auth-utils';
import '@/styles/globals.css';

export { metadata };

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: 'white' },
        { media: '(prefers-color-scheme: dark)', color: 'black' },
    ],
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const initialUser = await getCurrentSessionUser();

    return (
        <html lang="it" suppressHydrationWarning data-scroll-behavior="smooth">
            <head>
                {/* Security meta tags */}
                <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
                <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
                <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
                <meta
                    httpEquiv="Content-Security-Policy"
                    content="
                        default-src 'self';
                        script-src 'self' 'unsafe-inline' 'unsafe-eval';
                        style-src 'self' 'unsafe-inline';
                        img-src 'self' data: https://s3.eu-south-1.wasabisys.com;
                        font-src 'self' data:;
                        connect-src 'self' https://s3.eu-south-1.wasabisys.com;
                        media-src 'self' https://s3.eu-south-1.wasabisys.com;
                        object-src 'none';
                        base-uri 'self';
                        form-action 'self'
                    "
                />
            </head>
            <body className={`${baseFont.className} ${displayFont.variable}`}>
                {/* <div className="grain-overlay" aria-hidden="true" /> */}
                <Providers initialUser={initialUser}>
                    <div className="relative min-h-screen flex flex-col">
                        {children}
                    </div>
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}
