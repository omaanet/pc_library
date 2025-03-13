export interface Book {
    id: string;
    title: string;
    coverImage: string;
    publishingDate: string;
    summary: string;
    hasAudio: boolean;
    audioLength?: number;
    extract?: string;
    rating?: number;
    isPreview?: boolean;
    createdAt?: Date;
    updatedAt?: Date;

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
    emailNotifications: any;
    reading: any;
    theme: 'light' | 'dark' | 'system';
    language: string;
    fontSize: number;
    viewMode: 'list' | 'grid' | 'detailed';
    notifications: {
        email: boolean;
        push: boolean;
        SMS: boolean;
    };
    accessibility: {
        largeText: boolean | undefined;
        reduceAnimations: boolean | undefined;
        highContrast: boolean;
        reducedMotion: boolean;
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
    id: string;
    name: string;
    fullName: string;
    email: string;
    preferences: UserPreferences;
    isActivated: boolean;
    stats: UserStats;
    createdAt: Date;
    updatedAt?: Date;
}
