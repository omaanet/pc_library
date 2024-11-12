// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/providers/providers';
import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: {
        default: 'Digital Library',
        template: '%s | Digital Library',
    },
    description: 'A modern digital library for books and audiobooks',
    keywords: ['library', 'books', 'audiobooks', 'reading', 'digital'],
    authors: [{ name: 'Digital Library Team' }],
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
            <body className={inter.className}>
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