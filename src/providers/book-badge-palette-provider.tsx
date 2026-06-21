'use client';

import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { useBookBadgePalette } from '@/stores/preferences-store';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function BookBadgePaletteProvider({ children }: { children: ReactNode }) {
    const palette = useBookBadgePalette();

    useIsomorphicLayoutEffect(() => {
        document.documentElement.dataset.bookBadgePalette = palette;
    }, [palette]);

    return children;
}
