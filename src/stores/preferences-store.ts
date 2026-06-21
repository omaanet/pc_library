import { create } from 'zustand';
import {
    DEFAULT_USER_PREFERENCES,
    type BookBadgePalette,
    type ReaderViewMode,
    type ThemePreference,
    type UserPreferences,
} from '@/types/preferences';

export interface ReaderPreferences {
    viewMode: ReaderViewMode;
    zoomLevel: number;
}

export interface AppearancePreferences {
    bookBadgePalette: BookBadgePalette;
}

export interface PreferencesState {
    activeUserId: number | null;
    theme: ThemePreference;
    reader: ReaderPreferences;
    appearance: AppearancePreferences;
    hydrateForUser: (userId: number, preferences: UserPreferences) => void;
    resetToDefaults: () => void;
    setTheme: (theme: ThemePreference) => void;
    setViewMode: (mode: ReaderViewMode) => void;
    setZoomLevel: (level: number) => void;
    setBookBadgePalette: (palette: BookBadgePalette) => void;
}

function preferenceState(preferences: UserPreferences) {
    return {
        theme: preferences.theme,
        reader: {
            viewMode: preferences.readerViewMode,
            zoomLevel: preferences.readerZoom,
        },
        appearance: {
            bookBadgePalette: preferences.bookBadgePalette,
        },
    };
}

export function selectUserPreferences(state: PreferencesState): UserPreferences {
    return {
        theme: state.theme,
        bookBadgePalette: state.appearance.bookBadgePalette,
        readerViewMode: state.reader.viewMode,
        readerZoom: state.reader.zoomLevel,
    };
}

export const useReaderPreferencesStore = create<PreferencesState>()((set) => ({
    activeUserId: null,
    ...preferenceState({ ...DEFAULT_USER_PREFERENCES }),

    hydrateForUser: (userId, preferences) => {
        set({ activeUserId: userId, ...preferenceState(preferences) });
    },
    resetToDefaults: () => {
        set({ activeUserId: null, ...preferenceState({ ...DEFAULT_USER_PREFERENCES }) });
    },
    setTheme: (theme) => set({ theme }),
    setViewMode: (mode) => {
        set((state) => ({ reader: { ...state.reader, viewMode: mode } }));
    },
    setZoomLevel: (level) => {
        set((state) => ({ reader: { ...state.reader, zoomLevel: level } }));
    },
    setBookBadgePalette: (palette) => {
        set((state) => ({
            appearance: { ...state.appearance, bookBadgePalette: palette },
        }));
    },
}));

export const useReaderPreferences = () => useReaderPreferencesStore((state) => state.reader);
export const useSetViewMode = () => useReaderPreferencesStore((state) => state.setViewMode);
export const useSetZoomLevel = () => useReaderPreferencesStore((state) => state.setZoomLevel);
export const useThemePreference = () => useReaderPreferencesStore((state) => state.theme);
export const useSetThemePreference = () => useReaderPreferencesStore((state) => state.setTheme);
export const useBookBadgePalette = () => useReaderPreferencesStore(
    (state) => state.appearance.bookBadgePalette
);
export const useSetBookBadgePalette = () => useReaderPreferencesStore(
    (state) => state.setBookBadgePalette
);
