'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { BookAccessSettings } from '@/config/book-access';

interface BookAccessContextValue extends BookAccessSettings {
    setRequireAuthenticationForBookAccess: (required: boolean) => void;
}

const BookAccessContext = createContext<BookAccessContextValue | undefined>(undefined);

export function BookAccessProvider({
    children,
    initialSettings,
}: {
    children: ReactNode;
    initialSettings: BookAccessSettings;
}) {
    const [requireAuthenticationForBookAccess, setRequireAuthenticationForBookAccess] = useState(
        initialSettings.requireAuthenticationForBookAccess
    );
    const value = useMemo(() => ({
        requireAuthenticationForBookAccess,
        setRequireAuthenticationForBookAccess,
    }), [requireAuthenticationForBookAccess]);

    return <BookAccessContext.Provider value={value}>{children}</BookAccessContext.Provider>;
}

export function useBookAccess() {
    const context = useContext(BookAccessContext);
    if (!context) {
        throw new Error('useBookAccess must be used within BookAccessProvider');
    }
    return context;
}
