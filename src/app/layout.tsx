// src/app/layout.tsx
import type { Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { Providers } from '@/providers/providers';
import { Toaster } from '@/components/ui/toaster';
import { baseFont, displayFont } from '@/config/fonts';
import { metadata } from '@/config/metadata';
import { getCurrentSessionUser } from '@/lib/auth-utils';
import { APP_CONTENT_SECURITY_POLICY } from '@/lib/security/csp';
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
                    content={APP_CONTENT_SECURITY_POLICY}
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
                <Analytics />
            </body>
        </html>
    );
}
