// src/types/index.d.ts

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
    readingProgress?: number;
    status?: 'unread' | 'reading' | 'completed' | 'on-hold';
    isPreview?: boolean;
    displayOrder?: number;
    isVisible?: number;
    pagesCount?: number;
    mediaId?: string | null;
    mediaTitle?: string | null;
    mediaUid?: string | null;
    previewPlacement?: 'left' | 'right' | null;
}

export interface User {
    id: string;
    email: string;
    fullName: string;
    isActivated: boolean;
    preferences: UserPreferences;
    stats?: UserStats;
}

export interface UserStats {
    totalBooksRead: number;
    totalReadingTime: number;
    totalAudioTime: number;
    completedBooks: number;
    readingStreak: number;
    lastReadDate: string;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    viewMode: 'grid' | 'list';
    emailNotifications: {
        newReleases: boolean;
        readingReminders: boolean;
        recommendations: boolean;
    };
    accessibility: {
        reduceAnimations: boolean;
        highContrast: boolean;
        largeText: boolean;
    };
    reading: {
        fontSize: 'small' | 'medium' | 'large' | 'x-large';
        lineSpacing: 'tight' | 'normal' | 'relaxed';
        fontFamily: 'inter' | 'merriweather' | 'roboto' | 'openDyslexic';
    };
}

export interface BookFilters {
    search?: string;
    hasAudio?: boolean;
    minAudioLength?: number;
    maxAudioLength?: number;
    status?: Book['status'];
    minRating?: number;
}

export interface ReadingSession {
    id: string;
    userId: string;
    bookId: string;
    startPage: number;
    endPage: number;
    duration: number;
    date: string;
}

export interface AudioSession {
    id: string;
    userId: string;
    bookId: string;
    startTime: number;
    endTime: number;
    duration: number;
    date: string;
}

export interface BookProgress {
    bookId: string;
    userId: string;
    currentPage?: number;
    currentTime?: number;
    progress: number;
    lastReadDate: string;
    status: Book['status'];
    notes?: string[];
    bookmarks?: number[];
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
}