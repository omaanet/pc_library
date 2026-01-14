// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Providers } from '@/providers/providers';
import { Toaster } from '@/components/ui/toaster';
import { baseFont, displayFont } from '@/config/fonts';
import '@/styles/globals.css';

export const metadata: Metadata = {
    title: {
        default: 'Racconti in Voce e Caratteri',
        template: '%s | Racconti in Voce e Caratteri',
    },
    description: 'Sito web dedicato alla lettura a scopo benefico',
    keywords: ['racconti', 'audioracconti'],
    authors: [{ name: 'Piero Carbonetti' }],
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/favicon.ico', sizes: 'any' },
        ],
        apple: [
            { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
        ],
    },
    manifest: '/manifest.json',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: 'white' },
        { media: '(prefers-color-scheme: dark)', color: 'black' },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${baseFont.className} ${displayFont.variable}`}>
                {/* <div className="grain-overlay" aria-hidden="true" /> */}
                <Providers>
                    <div className="relative min-h-screen flex flex-col">
                        {children}
                    </div>
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}