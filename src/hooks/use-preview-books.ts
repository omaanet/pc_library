// src/hooks/use-preview-books.ts
import { useEffect, useState } from 'react';
import type { Book } from '@/types';
import { bookApiService } from '@/lib/services/book-api-service';

export interface UsePreviewBooksReturn {
    books: Book[];
    loading: boolean;
    mounted: boolean;
    error: string | null;
    retry: () => void;
}

/**
 * Custom hook to fetch and manage preview books
 * Uses the centralized bookApiService for API calls
 * Includes retry mechanism for failed requests
 * 
 * @returns Object containing books array, loading state, mounted state, error, and retry function
 */
export function usePreviewBooks(): UsePreviewBooksReturn {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        let isMounted = true;
        const abortController = new AbortController();

        async function fetchPreviewBooks() {
            try {
                setLoading(true);
                setError(null);
                const response = await bookApiService.fetchPreviewBooks({
                    sortOrder: 'desc',
                    isVisible: 1,
                });
                
                // Only update state if component is still mounted
                if (isMounted) {
                    setBooks(Array.isArray(response.books) ? response.books : []);
                }
            } catch (error) {
                // Ignore abort errors
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }
                
                // Enhanced error message with context
                let errorMessage = 'Failed to load preview books';
                if (error instanceof Error) {
                    errorMessage = error.message.includes('fetch')
                        ? 'Network error: Unable to connect to server'
                        : error.message;
                }
                
                console.error('Error loading preview books:', error);
                
                if (isMounted) {
                    setError(errorMessage);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchPreviewBooks();
        setMounted(true);
        
        return () => {
            isMounted = false;
            abortController.abort();
            setMounted(false);
        };
    }, [retryCount]);

    const retry = () => {
        setRetryCount(prev => prev + 1);
    };

    return {
        books,
        loading,
        mounted,
        error,
        retry,
    };
}
