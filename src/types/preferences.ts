export type BookBadgePalette =
    | 'gold'
    | 'ocean'
    | 'lagoon'
    | 'lavender'
    | 'coral'
    | 'paper';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ReaderViewMode = 'single' | 'double';

export interface UserPreferences {
    theme: ThemePreference;
    bookBadgePalette: BookBadgePalette;
    readerViewMode: ReaderViewMode;
    readerZoom: number;
}

export const DEFAULT_USER_PREFERENCES: Readonly<UserPreferences> = {
    theme: 'system',
    bookBadgePalette: 'gold',
    readerViewMode: 'double',
    readerZoom: 1,
};
