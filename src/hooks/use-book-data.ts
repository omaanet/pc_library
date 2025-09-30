import { useState, useEffect, useCallback } from 'react';
import type { BookResponse } from '@/types';
import type { LibraryFilters, LibrarySort } from '@/types/context';
import { bookApiService } from '@/lib/services/book-api-service';

export interface UseBookDataParams {
  displayPreviews: number;
  filters: LibraryFilters;
  sort: LibrarySort;
  perPage: number;
  onError?: (message: string) => void;
}

export interface UseBookDataReturn {
  books: any[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isInitialLoad: boolean;
  error: Error | null;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
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
  filters,
  sort,
  perPage,
  onError,
}: UseBookDataParams): UseBookDataReturn {
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });

  /**
   * Fetches books from the API using the book API service
   */
  const fetchBooks = useCallback(
    async (page: number = 1, append: boolean = false, searchTerm?: string) => {
      const isMounted = { current: true };

      try {
        if (!append) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        // Use the centralized API service
        const filterOverride = searchTerm !== undefined ? { ...filters, search: searchTerm } : filters;
        const data: BookResponse = await bookApiService.fetchBooks({
          page,
          perPage,
          sortBy: sort.by,
          sortOrder: sort.order,
          displayPreviews,
          filters: filterOverride,
        });

        if (isMounted.current) {
          if (append) {
            setBooks((prev) => [...prev, ...data.books]);
          } else {
            setBooks(data.books);
          }

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
        }
      } catch (err) {
        if (isMounted.current) {
          const errorObj = err instanceof Error ? err : new Error('Failed to fetch books');
          setError(errorObj);
          if (onError) {
            onError('Failed to load books. Please try again.');
          }
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
          if (isInitialLoad) {
            setIsInitialLoad(false);
          }
        }
      }

      return () => {
        isMounted.current = false;
      };
    },
    [displayPreviews, filters, perPage, sort.by, sort.order, isInitialLoad, onError]
  );

  /**
   * Load more books (pagination)
   */
  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || pagination.page >= pagination.totalPages) {
      return;
    }

    await fetchBooks(pagination.page + 1, true);
  }, [isLoading, isLoadingMore, pagination.page, pagination.totalPages, fetchBooks]);

  /**
   * Retry loading books after an error
   */
  const retry = useCallback(async () => {
    setError(null);
    await fetchBooks(1, false);
  }, [fetchBooks]);

  // Initial load and reload when dependencies change
  useEffect(() => {
    let isMounted = true;

    const loadBooks = async () => {
      await fetchBooks(1, false);
    };

    loadBooks();

    return () => {
      isMounted = false;
    };
  }, [displayPreviews, filters.search, filters.hasAudio, sort.by, sort.order, perPage]);

  return {
    books,
    isLoading,
    isLoadingMore,
    isInitialLoad,
    error,
    pagination,
    loadMore,
    retry,
  };
}
