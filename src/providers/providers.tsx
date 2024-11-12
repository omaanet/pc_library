// src/providers/providers.tsx
'use client';

import * as React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { LibraryProvider } from '@/context/library-context';
import { AuthProvider } from '@/context/auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
                <LibraryProvider>
                    {children}
                </LibraryProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}