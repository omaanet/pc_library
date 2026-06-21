// src/providers/providers.tsx
'use client';

import * as React from 'react';
import { LibraryProvider } from '@/context/library-context';
import { AuthProvider } from '@/context/auth-context';
import { QueryProvider } from './query-provider';
import { UserPreferencesProvider } from './user-preferences-provider';
import type { User } from '@/types';

export function Providers({ children, initialUser }: { children: React.ReactNode; initialUser: User | null }) {
    return (
        <QueryProvider>
            <AuthProvider initialUser={initialUser}>
                <UserPreferencesProvider>
                    <LibraryProvider>
                        {children}
                    </LibraryProvider>
                </UserPreferencesProvider>
            </AuthProvider>
        </QueryProvider>
    );
}
