// src/providers/providers.tsx
'use client';

import * as React from 'react';
import { LibraryProvider } from '@/context/library-context';
import { AuthProvider } from '@/context/auth-context';
import { QueryProvider } from './query-provider';
import { UserPreferencesProvider } from './user-preferences-provider';
import type { User } from '@/types';
import { BookAccessProvider } from '@/context/book-access-context';
import type { BookAccessSettings } from '@/config/book-access';

export function Providers({
    children,
    initialUser,
    initialBookAccessSettings,
}: {
    children: React.ReactNode;
    initialUser: User | null;
    initialBookAccessSettings: BookAccessSettings;
}) {
    return (
        <QueryProvider>
            <AuthProvider initialUser={initialUser}>
                <BookAccessProvider initialSettings={initialBookAccessSettings}>
                    <UserPreferencesProvider>
                        <LibraryProvider>
                            {children}
                        </LibraryProvider>
                    </UserPreferencesProvider>
                </BookAccessProvider>
            </AuthProvider>
        </QueryProvider>
    );
}
