/**
 * FUTURE FEATURES - Type Definitions
 * 
 * These types are reserved for future implementation.
 * They are not currently used in the application but are kept here for reference.
 * 
 * When implementing these features:
 * 1. Move the relevant types back to index.ts
 * 2. Update imports throughout the codebase
 * 3. Remove this comment block
 */

/**
 * User preferences and settings
 * Will be used for the user settings page and personalization features
 */
export interface UserPreferences {
    emailNotifications?: {
        newBooks?: boolean;
        newReleases?: boolean;
        readingReminders?: boolean;
        recommendations?: boolean;
        updates?: boolean;
        newsletter?: boolean;
    };
    reading?: {
        autoplay?: boolean;
        defaultView?: 'single' | 'double';
        defaultZoom?: number;
        fontSize?: number;
        lineHeight?: number | string;
        fontFamily?: string;
    };
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    fontSize?: number;
    viewMode?: 'list' | 'grid' | 'detailed';
    notifications?: {
        email: boolean;
        push: boolean;
        SMS: boolean;
    };
    accessibility?: {
        largeText?: boolean;
        reduceAnimations?: boolean;
        highContrast?: boolean;
        reducedMotion?: boolean;
    };
    lastUpdated?: Date;
}

/**
 * User reading statistics and achievements
 * Will be used for the user dashboard and progress tracking
 */
export interface UserStats {
    totalBooksRead: number;
    totalReadingTime: number; // in hours
    totalAudioTime: number; // in hours
    completedBooks: number;
    readingStreak: number;
    lastReadDate: string;
}

/**
 * Audiobook information associated with a book
 * Will be used when implementing full audiobook support
 */
export interface AudioBookInfo {
    /** Mux media ID for the audiobook, null if not available */
    mediaId: string | null;
}
