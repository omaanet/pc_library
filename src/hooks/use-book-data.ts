import { useState, useEffect, useCallback, useRef } from 'react';
import type { Book, BookResponse } from '@/types';
import type { LibrarySort } from '@/types/context';
import { bookApiService } from '@/lib/services/book-api-service';

export interface UseBookDataParams {
  displayPreviews: number;
  sort: LibrarySort;
  onError?: (message: string) => void;
}

export interface UseBookDataReturn {
  books: Book[];
  isLoading: boolean;
  isInitialLoad: boolean;
  error: Error | null;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  retry: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing book data fetching, pagination, and error handling.
 * 
 * @param params - Configuration object containing display preferences, filters, sort, and pagination settings
 * @returns Object containing books data, loading states, pagination info, and action handlers
 * 
 * @example
 * ```tsx
 * const { books, isLoading, loadMore, retry } = useBookData({
 *   displayPreviews: 0,
 *   filters: { search: 'fantasy', hasAudio: true },
 *   sort: { by: 'title', order: 'asc' },
 *   perPage: 10,
 *   onError: (msg) => toast({ title: 'Error', description: msg })
 * });
 * ```
 */
export function useBookData({
  displayPreviews,
  sort,
  onError,
}: UseBookDataParams): UseBookDataReturn {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });

  const activeRequestIdRef = useRef(0);

  /**
   * Fetches books from the API using the book API service
   */
  const fetchBooks = useCallback(
    async () => {
      try {
        const requestId = ++activeRequestIdRef.current;
        setIsLoading(true);

        // Use the centralized API service
        const data: BookResponse = await bookApiService.fetchBooks({
          page: 1,
          perPage: -1,
          sortBy: sort.by,
          sortOrder: sort.order,
          displayPreviews,
        });

        if (requestId !== activeRequestIdRef.current) {
          return;
        }

        setBooks(data.books);

        if (data.pagination) {
          setPagination({
            page: data.pagination.page,
            perPage: data.pagination.perPage,
            total: data.pagination.total,
            totalPages:
              data.pagination.totalPages ||
              Math.ceil(data.pagination.total / data.pagination.perPage),
          });
        }

        setError(null);
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Failed to fetch books');
        setError(errorObj);
        if (onError) {
          onError('Failed to load books. Please try again.');
        }
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    },
    [displayPreviews, sort.by, sort.order, onError]
  );

  /**
   * Retry loading books after an error
   */
  const retry = useCallback(async () => {
    setError(null);
    await fetchBooks();
  }, [fetchBooks]);

  const refresh = useCallback(async () => {
    await fetchBooks();
  }, [fetchBooks]);

  // Initial load and reload when dependencies change
  useEffect(() => {
    // Skip fetch on server-side rendering
    if (typeof window === 'undefined') return;

    fetchBooks();
  }, [displayPreviews, sort.by, sort.order, fetchBooks]);

  return {
    books,
    isLoading,
    isInitialLoad,
    error,
    pagination,
    retry,
    refresh,
  };
}
