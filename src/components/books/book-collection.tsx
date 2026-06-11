'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useLibrary } from '@/context/library-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { BookDialogSimple } from './book-dialog';
import { AuthModal } from '@/components/auth/auth-modal';
import { BookGridSkeleton } from '@/components/ui/loading-placeholder';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';
import { useBookData } from '@/hooks/use-book-data';
import { useBookSearch } from '@/hooks/use-book-search';
import { BookCollectionControls } from './book-collection-controls';
import { BookCollectionFilters } from './book-collection-filters';
import { BookCollectionGrid } from './book-collection-grid';
import { BookCollectionLoadMore } from './book-collection-load-more';
import { BookCollectionError } from './book-collection-error';
import { BookCollectionEmpty } from './book-collection-empty';
import { SITE_CONFIG } from '@/config/site-config';
import {
    clearLibraryReturnState,
    readLibraryReturnState,
} from '@/lib/library-return-state';
import type { Book } from '@/types';
import { isAudioAvailable } from '@/lib/book-visibility';
import { BOOK_SORT_PRESETS } from '@/lib/book-sort';

// Number of books to preload images for
const PRELOAD_COUNT = 4;

interface BookCollectionProps {
    displayPreviews: number; // -1: all, 0: non-preview only, 1: preview only
}

/**
 * Main book collection component that displays a filterable, searchable grid/list of books.
 * Refactored to use custom hooks and smaller sub-components for better maintainability.
 * 
 * **State Management Strategy:**
 * - **Context (useLibrary)**: Manages global state shared across multiple instances
 *   (viewMode, selectedBook, filters, sort, pagination settings)
 * - **Custom Hooks (useBookData, useBookSearch)**: Encapsulate data fetching and search logic
 *   with their own internal state (books, loading states, errors)
 * - **Local State**: Component-specific UI state (auth modal, image preloading, refs)
 * 
 * This separation ensures each BookCollection instance can maintain its own data
 * while sharing global UI preferences through context.
 */
export function BookCollection({ displayPreviews }: BookCollectionProps) {
    // Context: Global state shared across app
    const {
        state: { books: cachedBooks, viewMode, selectedBook, filters, pagination },
        dispatch,
        selectBook,
        updateFilters,
    } = useLibrary();

    const {
        state: { isAuthenticated },
    } = useAuth();
    const { toast } = useToast();

    // Local state
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
    const [returnState, setReturnState] = useState(() => readLibraryReturnState());
    const [isRestoringReturnState, setIsRestoringReturnState] = useState(() => !!returnState);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const returnControlsRestoredRef = useRef(false);
    const selectedBookFetchStartedRef = useRef(false);

    // Stabilize onError callback to prevent useBookData from re-creating fetchBooks
    const onError = useCallback((message: string) => {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: message,
        });
    }, [toast]);

    const onBooksLoaded = useCallback((loadedBooks: Book[]) => {
        dispatch({ type: 'SET_BOOKS', payload: loadedBooks });
    }, [dispatch]);

    // Custom hooks for data fetching and search
    const {
        books,
        isLoading,
        isInitialLoad,
        error,
        retry,
        refresh,
    } = useBookData({
        displayPreviews,
        sortPreset: BOOK_SORT_PRESETS.MAIN_LIBRARY,
        initialBooks: cachedBooks,
        onBooksLoaded,
        onError,
    });

    const finishReturnStateRestore = useCallback(() => {
        clearLibraryReturnState();
        setReturnState(null);
        setIsRestoringReturnState(false);
    }, []);

    useEffect(() => {
        if (!returnState || returnControlsRestoredRef.current) return;

        dispatch({ type: 'SET_FILTERS', payload: returnState.filters });
        dispatch({ type: 'SET_SORT', payload: returnState.sort });
        dispatch({ type: 'SET_VIEW_MODE', payload: returnState.viewMode });
        returnControlsRestoredRef.current = true;
    }, [dispatch, returnState]);

    useEffect(() => {
        if (!returnState) return;

        if (selectedBook?.id === returnState.selectedBookId) {
            finishReturnStateRestore();
            return;
        }

        const restoredBook = books.find((book) => book.id === returnState.selectedBookId);
        if (restoredBook) {
            selectBook(restoredBook);
            finishReturnStateRestore();
            return;
        }

        if (isInitialLoad || isLoading || selectedBookFetchStartedRef.current) return;

        selectedBookFetchStartedRef.current = true;
        void fetch(`/api/books/${returnState.selectedBookId}`)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Failed to restore selected book: ${response.status}`);
                }

                return response.json() as Promise<Book>;
            })
            .then((book) => {
                selectBook(book);
            })
            .catch(() => {
                // If the selected book cannot be restored, still allow the library to render.
            })
            .finally(() => {
                finishReturnStateRestore();
            });
    }, [
        books,
        finishReturnStateRestore,
        isInitialLoad,
        isLoading,
        returnState,
        selectBook,
        selectedBook,
    ]);

    // Use ref to stabilize onSearch callback and prevent unnecessary re-renders
    const updateFiltersRef = useRef(updateFilters);
    updateFiltersRef.current = updateFilters;

    const onSearch = useCallback((term: string) => {
        updateFiltersRef.current({ search: term });
    }, []);

    const { searchTerm, handleSearch, handleSearchBlur } = useBookSearch({
        onSearch,
        debounceMs: 250,
        minSearchLength: 0,
        initialSearchTerm: filters.search,
    });

    // Audio filter handler
    const handleAudioFilterChange = useCallback(
        (checked: boolean) => {
            // When checked: show only books with audio (true)
            // When unchecked: show all books (undefined)
            updateFilters({ hasAudio: checked ? true : undefined });
        },
        [updateFilters]
    );

    const pageSize = useMemo(() => {
        return pagination.perPage > 0
            ? pagination.perPage
            : SITE_CONFIG.PAGINATION.DEFAULT_PER_PAGE;
    }, [pagination.perPage]);

    const normalizedSearchTerm = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);

    const filteredBooks = useMemo(() => {
        let result = books;

        if (filters.hasAudio) {
            result = result.filter(isAudioAvailable);
        }

        if (normalizedSearchTerm.length > 0) {
            result = result.filter((book) => book.title.toLowerCase().includes(normalizedSearchTerm));
        }

        return result;
    }, [books, filters.hasAudio, normalizedSearchTerm]);

    const [visibleCount, setVisibleCount] = useState(() => pageSize);

    useEffect(() => {
        setVisibleCount(pageSize);
    }, [pageSize, normalizedSearchTerm, filters.hasAudio]);

    useEffect(() => {
        setVisibleCount((prev) => {
            if (filteredBooks.length === 0) return pageSize;
            return Math.min(prev, filteredBooks.length);
        });
    }, [filteredBooks.length, pageSize]);

    const visibleBooks = useMemo(() => {
        return filteredBooks.slice(0, visibleCount);
    }, [filteredBooks, visibleCount]);

    const handleLoadMore = useCallback(() => {
        setVisibleCount((prev) => Math.min(prev + pageSize, filteredBooks.length));
    }, [filteredBooks.length, pageSize]);

    const hasMore = visibleCount < filteredBooks.length;

    // Preload book cover images for visible books
    useEffect(() => {
        if (!visibleBooks || visibleBooks.length === 0) return;

        // Only preload a limited number of books
        const booksToPreload = visibleBooks.slice(0, PRELOAD_COUNT);

        // Skip already loaded images
        const unloadedBooks = booksToPreload.filter((book) => {
            return !loadedImages.has(book.coverImage);
        });

        if (unloadedBooks.length === 0) return;

        const preloadImages = unloadedBooks.map((book) => {
            return new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => {
                    setLoadedImages((prev) => new Set([...prev, book.coverImage]));
                    resolve();
                };
                img.onerror = () => resolve(); // Don't block on error

                // Use getCoverImageUrl to properly handle placeholder images
                const isPlaceholder = book.coverImage === IMAGE_CONFIG.placeholder.token;
                const imageUrl = getCoverImageUrl(book.coverImage, 'grid', {
                    bookId: isPlaceholder ? book.id : undefined,
                });
                img.src = imageUrl;
            });
        });

        Promise.all(preloadImages).catch(console.error);
    }, [visibleBooks, loadedImages]);

    // Focus search input on initial mount only
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showLoadingState = isLoading;
    const showRestoringState = isRestoringReturnState && filteredBooks.length === 0;

    // Early return for error state
    if (error) {
        return (
            <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-4 space-y-4 sm:space-y-6">
                <BookCollectionError error={error} onRetry={retry} />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[2000px] mx-auto px-1 sm:px-4 space-y-4 sm:space-y-6">
            {/* Controls Section */}
            <BookCollectionControls
                onRefresh={refresh}
                isRefreshing={!isInitialLoad && isLoading}
            />

            {/* Filters Section */}
            <BookCollectionFilters
                searchTerm={searchTerm}
                onSearchChange={handleSearch}
                onSearchBlur={handleSearchBlur}
                audioFilter={filters.hasAudio}
                onAudioFilterChange={handleAudioFilterChange}
                disabled={false}
                searchInputRef={searchInputRef}
            />

            {/* Books Grid/List */}
            <div className="min-h-[600px] transition-opacity duration-300">
                {(isInitialLoad && showLoadingState) || showRestoringState ? (
                    <BookGridSkeleton count={pageSize} />
                ) : (
                    <div className="space-y-6 w-full">
                        {filteredBooks.length > 0 ? (
                            <>
                                <BookCollectionGrid books={visibleBooks} viewMode={viewMode} onSelectBook={selectBook} />

                                {/* Load More */}
                                <BookCollectionLoadMore
                                    hasMore={hasMore}
                                    isLoading={false}
                                    onLoadMore={handleLoadMore}
                                    shownCount={visibleBooks.length}
                                    totalCount={filteredBooks.length}
                                />
                            </>
                        ) : (
                            <BookCollectionEmpty />
                        )}
                    </div>
                )}
            </div>

            {/* Book Dialog */}
            <BookDialogSimple
                book={selectedBook}
                open={!!selectedBook}
                onOpenChange={(open) => !open && selectBook(null)}
                isAuthenticated={isAuthenticated}
                onLoginClick={() => {
                    setIsAuthModalOpen(true);
                }}
            />

            {/* Auth Modal */}
            <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
        </div>
    );
}
