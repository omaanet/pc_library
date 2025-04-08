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
        default: 'Racconti in Voce e Caratteri',
        template: '%s | Racconti in Voce e Caratteri',
    },
    description: 'Sito web dedicato alla lettura a scopo benefico',
    keywords: ['racconti', 'audioracconti'],
    authors: [{ name: 'Piero Carbonetti' }],
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