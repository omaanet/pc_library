// src/stores/preferences-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    DEFAULT_BOOK_BADGE_PALETTE,
    isBookBadgePalette,
} from '@/config/book-badge-palettes';
import type { BookBadgePalette } from '@/types/preferences';

// Reader-specific preferences for the book reading page
export interface ReaderPreferences {
    viewMode: 'single' | 'double';
    zoomLevel: number;
}

export interface AppearancePreferences {
    bookBadgePalette: BookBadgePalette;
}

export interface PreferencesState {
    reader: ReaderPreferences;
    appearance: AppearancePreferences;
    
    setViewMode: (mode: 'single' | 'double') => void;
    setZoomLevel: (level: number) => void;
    setBookBadgePalette: (palette: BookBadgePalette) => void;
    resetToDefaults: () => void;
}

const defaultReaderPreferences: ReaderPreferences = {
    viewMode: 'double',
    zoomLevel: 1.0,
};

const defaultAppearancePreferences: AppearancePreferences = {
    bookBadgePalette: DEFAULT_BOOK_BADGE_PALETTE,
};

export const useReaderPreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            reader: defaultReaderPreferences,
            appearance: defaultAppearancePreferences,
            
            setViewMode: (mode) => {
                set((state) => ({
                    reader: { ...state.reader, viewMode: mode }
                }));
            },
            
            setZoomLevel: (level) => {
                set((state) => ({
                    reader: { ...state.reader, zoomLevel: level }
                }));
            },

            setBookBadgePalette: (palette) => {
                set((state) => ({
                    appearance: { ...state.appearance, bookBadgePalette: palette }
                }));
            },
            
            resetToDefaults: () => {
                set({ reader: defaultReaderPreferences });
            },
        }),
        {
            name: 'reader-preferences',
            storage: createJSONStorage(() => localStorage),
            version: 2,
            migrate: (persistedState) => {
                const state = persistedState as Partial<PreferencesState> | undefined;
                const persistedPalette = state?.appearance?.bookBadgePalette;

                return {
                    ...state,
                    reader: {
                        ...defaultReaderPreferences,
                        ...state?.reader,
                    },
                    appearance: {
                        ...defaultAppearancePreferences,
                        ...state?.appearance,
                        bookBadgePalette: isBookBadgePalette(persistedPalette)
                            ? persistedPalette
                            : DEFAULT_BOOK_BADGE_PALETTE,
                    },
                } as PreferencesState;
            },
        }
    )
);

export const useReaderPreferences = () => useReaderPreferencesStore((state) => state.reader);
export const useSetViewMode = () => useReaderPreferencesStore((state) => state.setViewMode);
export const useSetZoomLevel = () => useReaderPreferencesStore((state) => state.setZoomLevel);
export const useBookBadgePalette = () => useReaderPreferencesStore(
    (state) => state.appearance.bookBadgePalette
);
export const useSetBookBadgePalette = () => useReaderPreferencesStore(
    (state) => state.setBookBadgePalette
);
