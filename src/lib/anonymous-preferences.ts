import {
    DEFAULT_USER_PREFERENCES,
    type BookBadgePalette,
    type ReaderViewMode,
    type ThemePreference,
    type UserPreferences,
} from '@/types/preferences';

export const ANONYMOUS_PREFERENCES_STORAGE_KEY = 'anonymous-preferences:v1';

const THEMES: readonly ThemePreference[] = ['light', 'dark', 'system'];
const BOOK_BADGE_PALETTES: readonly BookBadgePalette[] = [
    'gold',
    'ocean',
    'lagoon',
    'lavender',
    'coral',
    'paper',
];
const READER_VIEW_MODES: readonly ReaderViewMode[] = ['single', 'double'];

interface StoredAnonymousPreferences {
    version: 1;
    preferences: UserPreferences;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function includes<T extends string>(values: readonly T[], value: unknown): value is T {
    return typeof value === 'string' && values.includes(value as T);
}

function normalizePreferences(value: unknown): UserPreferences {
    const preferences = isRecord(value) ? value : {};
    const readerZoom = preferences.readerZoom;

    return {
        theme: includes(THEMES, preferences.theme)
            ? preferences.theme
            : DEFAULT_USER_PREFERENCES.theme,
        bookBadgePalette: includes(BOOK_BADGE_PALETTES, preferences.bookBadgePalette)
            ? preferences.bookBadgePalette
            : DEFAULT_USER_PREFERENCES.bookBadgePalette,
        readerViewMode: includes(READER_VIEW_MODES, preferences.readerViewMode)
            ? preferences.readerViewMode
            : DEFAULT_USER_PREFERENCES.readerViewMode,
        readerZoom: typeof readerZoom === 'number' && Number.isFinite(readerZoom)
            ? Math.min(3, Math.max(0.1, readerZoom))
            : DEFAULT_USER_PREFERENCES.readerZoom,
    };
}

export function loadAnonymousPreferences(storage: Storage): UserPreferences {
    try {
        const serialized = storage.getItem(ANONYMOUS_PREFERENCES_STORAGE_KEY);
        if (serialized) {
            const stored: unknown = JSON.parse(serialized);
            if (isRecord(stored) && stored.version === 1) {
                return normalizePreferences(stored.preferences);
            }
        }

        // Preserve the theme used by older releases, then retire their shared key.
        const legacyTheme = storage.getItem('theme');
        const preferences = {
            ...DEFAULT_USER_PREFERENCES,
            theme: includes(THEMES, legacyTheme)
                ? legacyTheme
                : DEFAULT_USER_PREFERENCES.theme,
        };
        if (includes(THEMES, legacyTheme)) {
            saveAnonymousPreferences(storage, preferences);
        }
        storage.removeItem('theme');
        return preferences;
    } catch {
        // Storage can be unavailable or contain malformed data in restricted contexts.
        return { ...DEFAULT_USER_PREFERENCES };
    }
}

export function saveAnonymousPreferences(
    storage: Storage,
    preferences: UserPreferences
): void {
    try {
        const stored: StoredAnonymousPreferences = {
            version: 1,
            preferences: normalizePreferences(preferences),
        };
        storage.setItem(ANONYMOUS_PREFERENCES_STORAGE_KEY, JSON.stringify(stored));
    } catch {
        // Preferences remain active for the current page when storage is unavailable.
    }
}
