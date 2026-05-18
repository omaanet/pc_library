'use client';

import type { Book } from '@/types';
import type { LibraryFilters, LibrarySort, ViewMode } from '@/types/context';

const STORAGE_KEY = 'bookLibrary_readerReturnState';

export interface LibraryReturnState {
    selectedBookId: Book['id'];
    filters: LibraryFilters;
    sort: LibrarySort;
    viewMode: ViewMode;
    createdAt: number;
}

export function saveLibraryReturnState(state: Omit<LibraryReturnState, 'createdAt'>): void {
    if (typeof window === 'undefined') return;

    try {
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                ...state,
                createdAt: Date.now(),
            })
        );
    } catch {
        // Navigation should still work if storage is unavailable.
    }
}

export function readLibraryReturnState(): LibraryReturnState | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored) as Partial<LibraryReturnState>;
        if (!parsed.selectedBookId || !parsed.filters || !parsed.sort || !parsed.viewMode) {
            return null;
        }

        return parsed as LibraryReturnState;
    } catch {
        return null;
    }
}

export function clearLibraryReturnState(): void {
    if (typeof window === 'undefined') return;

    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // Ignore storage cleanup failures.
    }
}
