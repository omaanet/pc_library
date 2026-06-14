'use client';

import { useEffect, type ReactNode } from 'react';
import { useBookBadgePalette } from '@/stores/preferences-store';

export function BookBadgePaletteProvider({ children }: { children: ReactNode }) {
    const palette = useBookBadgePalette();

    useEffect(() => {
        document.documentElement.dataset.bookBadgePalette = palette;
    }, [palette]);

    return children;
}
