/**
 * Audiobook information associated with a book.
 * Contains media metadata for books that have audio versions.
 * Used as an optional property in the Book interface.
 */
export interface AudioBookInfo {
    /** Mux media ID for the audiobook, null if not available */
    mediaId: string | null;
}

export interface Book {
    id: string;
    title: string;
    coverImage: string;
    publishingDate: string;
    summary: string;
    hasAudio: boolean;
    audioLength?: number; // Kept for backward compatibility
    extract?: string;
    rating?: number;
    isPreview?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    displayOrder?: number;
    isVisible?: number;
    pagesCount?: number;
    audiobook?: AudioBookInfo;

    // Preview media (Mux) fields stored on books table
    mediaId?: string | null;
    mediaTitle?: string | null;
    mediaUid?: string | null;
    previewPlacement?: 'left' | 'right' | null;

    // Application-specific fields
    readingProgress?: number;
    status?: 'unread' | 'reading' | 'completed' | 'on-hold';
}

export interface AudioBook {
    id: number;
    book_id: string;
    media_id: string | null;
    audio_length: number | null;
    publishing_date: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface UserPreferences {
    emailNotifications?: any;
    reading?: any;
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

export interface UserStats {
    totalBooksRead: number;
    totalReadingTime: number; // in hours
    totalAudioTime: number; // in hours
    completedBooks: number;
    readingStreak: number;
    lastReadDate: string;
}

export interface User {
    isAdmin?: boolean;
    id: number;
    email: string;
    fullName: string; // maps to full_name in DB
    isActivated: boolean; // maps to is_activated in DB
    name: string; // Derived from fullName
    // The following fields are optional as they might not be present in all contexts
    verification_token?: string;
    password_hash?: string;
    preferences?: UserPreferences; // Joined from user_preferences table
    stats?: UserStats; // Joined from user_stats table
    createdAt?: Date; // maps to created_at in DB
    updatedAt?: Date; // maps to updated_at in DB
}

export interface BookResponse {
    books: Book[];
    pagination?: {
        total: number;
        page: number;
        perPage: number;
        hasMore: boolean;
        totalPages: number;
    };
}
