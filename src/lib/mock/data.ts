// src/lib/mock/data.ts
import type { Book, User, UserPreferences, UserStats } from '@/types';

// Mock User Preferences
export const defaultUserPreferences: UserPreferences = {
    theme: 'system',
    viewMode: 'grid',
    emailNotifications: {
        newReleases: true,
        readingReminders: true,
        recommendations: true,
    },
    accessibility: {
        reduceAnimations: false,
        highContrast: false,
        largeText: false,
    },
    reading: {
        fontSize: 'medium',
        lineSpacing: 'normal',
        fontFamily: 'inter',
    },
};

// Mock User Stats
export const mockUserStats: UserStats = {
    totalBooksRead: 24,
    totalReadingTime: 1250,
    totalAudioTime: 840,
    completedBooks: 18,
    readingStreak: 5,
    lastReadDate: new Date().toISOString(),
};

// Mock User
export const mockUser: User = {
    id: 'user_1',
    email: 'demo@example.com',
    fullName: 'Demo User',
    isActivated: true,
    preferences: defaultUserPreferences,
    stats: mockUserStats,
};

// Mock Books
export const mockBooks: Book[] = [
    {
        id: 'book_1',
        title: 'The Art of Programming',
        coverImage: '/api/placeholder/240/360',
        publishingDate: '2024-01-15',
        summary: 'A comprehensive guide to modern programming practices and patterns.',
        hasAudio: true,
        audioLength: 720,
        extract: 'In the world of programming, clarity and simplicity often trump clever complexity...',
        rating: 4.5,
        readingProgress: 35,
    },
    {
        id: 'book_2',
        title: 'Digital Age Design',
        coverImage: '/api/placeholder/240/360',
        publishingDate: '2024-02-01',
        summary: 'Exploring the principles of design in the modern digital landscape.',
        hasAudio: true,
        audioLength: 540,
        rating: 4.8,
    },
    {
        id: 'book_3',
        title: 'Future of Technology',
        coverImage: '/api/placeholder/240/360',
        publishingDate: '2024-02-15',
        summary: 'A deep dive into emerging technologies and their impact on society.',
        hasAudio: false,
        extract: 'Technology continues to reshape our world at an unprecedented pace...',
        rating: 4.2,
        readingProgress: 75,
    },
    {
        id: 'book_4',
        title: 'Web Development Mastery',
        coverImage: '/api/placeholder/240/360',
        publishingDate: '2024-03-01',
        summary: 'Master modern web development with practical examples and best practices.',
        hasAudio: true,
        audioLength: 960,
        rating: 4.6,
    },
    {
        id: 'book_5',
        title: 'AI and Machine Learning',
        coverImage: '/api/placeholder/240/360',
        publishingDate: '2024-03-15',
        summary: 'Understanding artificial intelligence and its applications in today\'s world.',
        hasAudio: true,
        audioLength: 840,
        extract: 'The field of artificial intelligence has evolved dramatically...',
        rating: 4.9,
        readingProgress: 15,
    },
];

// Mock API Response Generator
export function generateMockApiResponse<T>(
    data: T,
    delay: number = 800
): Promise<T> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(data);
        }, delay);
    });
}

// Paginated Books Response Generator
export function getPaginatedBooks(
    page: number = 1,
    perPage: number = 20,
    filters?: {
        search?: string;
        hasAudio?: boolean;
    }
) {
    let filteredBooks = [...mockBooks];

    // Apply filters
    if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredBooks = filteredBooks.filter(
            book =>
                book.title.toLowerCase().includes(searchLower) ||
                book.summary.toLowerCase().includes(searchLower)
        );
    }

    if (filters?.hasAudio !== undefined) {
        filteredBooks = filteredBooks.filter(book => book.hasAudio === filters.hasAudio);
    }

    // Calculate pagination
    const total = filteredBooks.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const books = filteredBooks.slice(start, end);

    return {
        books,
        pagination: {
            total,
            totalPages,
            page,
            perPage,
        },
    };
}