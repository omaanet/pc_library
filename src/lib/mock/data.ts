// src/lib/mock/data.ts
import type { Book, User, UserPreferences } from '@/types';

const PLACEHOLDER_TOKEN = '@placeholder';

// Generate a list of mock books
const mockBooks: Book[] = Array.from({ length: 50 }, (_, index) => {
    const id = `book-${String(index + 1).padStart(3, '0')}`;
    const hasAudio = index % 3 === 0;
    const audioLength = hasAudio ? Math.floor(Math.random() * 720) + 180 : undefined; // 3-15 hours
    const rating = Math.random() > 0.3 ? (Math.floor(Math.random() * 4) + 2) : undefined;
    const readingProgress = Math.random() > 0.7 ? Math.floor(Math.random() * 100) : undefined;

    return {
        id,
        title: `The Book ${index + 1}`,
        // In production this would be a real path like 'books/fantasy/book1.jpg'
        coverImage: PLACEHOLDER_TOKEN,
        publishingDate: new Date(2020 + Math.floor(index / 12), index % 12, 1).toISOString(),
        summary: `This is a summary for book ${index + 1}. It provides a brief overview of what readers can expect.`,
        hasAudio,
        audioLength,
        extract: Math.random() > 0.5
            ? `This is a sample extract from book ${index + 1}. It gives readers a taste of the content.`
            : undefined,
        rating,
        readingProgress,
        status: readingProgress !== undefined
            ? (readingProgress === 100 ? 'completed' : 'reading')
            : undefined,
    };
});

// Default user preferences
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
        reducedMotion: false,
    },
    reading: {
        fontSize: 'medium',
        lineSpacing: 'normal',
        fontFamily: 'inter',
    },
    language: '',
    fontSize: 0,
    notifications: {
        email: false,
        push: false,
        SMS: false
    }
};

// Mock user data
export const mockUser: User = {
    id: 'user-001',
    email: 'user@example.com',
    fullName: 'John Doe',
    isActivated: true,
    preferences: defaultUserPreferences,
    stats: {
        totalBooksRead: 12,
        totalReadingTime: 4320, // 72 hours
        totalAudioTime: 2160, // 36 hours
        completedBooks: 8,
        readingStreak: 5,
        lastReadDate: new Date().toISOString(),
    },
    name: '',
    createdAt: new Date()
};

// Function to get paginated books with optional filters
interface BookFilters {
    search?: string;
    hasAudio?: boolean;
}

export function getPaginatedBooks(
    page: number = 1,
    perPage: number = 20,
    filters: BookFilters = {}
) {
    let filteredBooks = [...mockBooks];

    // Apply filters
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredBooks = filteredBooks.filter(book =>
            book.title.toLowerCase().includes(searchLower) ||
            book.summary.toLowerCase().includes(searchLower)
        );
    }

    if (filters.hasAudio !== undefined) {
        filteredBooks = filteredBooks.filter(book =>
            book.hasAudio === filters.hasAudio
        );
    }

    // Calculate pagination
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedBooks = filteredBooks.slice(start, end);

    return {
        books: paginatedBooks,
        pagination: {
            total: filteredBooks.length,
            page,
            perPage,
            totalPages: Math.ceil(filteredBooks.length / perPage),
        },
    };
}

// Function to get book by ID
export function getBookById(id: string): Book | undefined {
    return mockBooks.find(book => book.id === id);
}

// Function to get recommended books
export function getRecommendedBooks(limit: number = 5): Book[] {
    return mockBooks
        .filter(book => book.rating && book.rating >= 4)
        .slice(0, limit);
}

// Function to get popular books
export function getPopularBooks(limit: number = 5): Book[] {
    return mockBooks
        .filter(book => book.hasAudio)
        .slice(0, limit);
}

// Export for use in components
export { mockBooks };