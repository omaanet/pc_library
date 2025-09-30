// src/hooks/use-preview-books.ts
import { useEffect, useState } from 'react';
import type { Book } from '@/types';

export interface UsePreviewBooksReturn {
    books: Book[];
    loading: boolean;
    mounted: boolean;
    error: string | null;
}

export function usePreviewBooks(): UsePreviewBooksReturn {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPreviewBooks() {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch('/api/books?displayPreviews=1&sortOrder=desc&isVisible=1');
                if (!response.ok) {
                    throw new Error(`Failed to fetch preview books: ${response.status}`);
                }
                const { books } = await response.json();
                setBooks(Array.isArray(books) ? books : []);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                console.error('Error loading preview books:', error);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        }

        fetchPreviewBooks();
        setMounted(true);
        return () => setMounted(false);
    }, []);

    return {
        books,
        loading,
        mounted,
        error,
    };
}
