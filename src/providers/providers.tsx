// src/providers/providers.tsx
'use client';

import * as React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { LibraryProvider } from '@/context/library-context';
import { AuthProvider } from '@/context/auth-context';
import { QueryProvider } from './query-provider';
import { BookBadgePaletteProvider } from './book-badge-palette-provider';
import type { User } from '@/types';

export function Providers({ children, initialUser }: { children: React.ReactNode; initialUser: User | null }) {
    return (
        <QueryProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <BookBadgePaletteProvider>
                    <AuthProvider initialUser={initialUser}>
                        <LibraryProvider>
                            {children}
                        </LibraryProvider>
                    </AuthProvider>
                </BookBadgePaletteProvider>
            </ThemeProvider>
        </QueryProvider>
    );
}
