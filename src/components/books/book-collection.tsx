'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
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
        state: { viewMode, selectedBook, filters, sort, pagination, isFiltersReady },
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
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Custom hooks for data fetching and search
    const {
        books,
        isLoading,
        isLoadingMore,
        isInitialLoad,
        error,
        pagination: localPagination,
        loadMore,
        retry,
    } = useBookData({
        displayPreviews,
        filters,
        sort,
        perPage: pagination.perPage,
        isFiltersReady, // Pass the ready flag to prevent premature fetching
        onError: (message) =>
            toast({
                variant: 'destructive',
                title: 'Error',
                description: message,
            }),
    });

    const { searchTerm, handleSearch, handleSearchBlur } = useBookSearch({
        onSearch: (term) => {
            updateFilters({ search: term });
        },
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

    // Preload book cover images for visible books
    useEffect(() => {
        if (!books || books.length === 0) return;

        // Only preload a limited number of books
        const booksToPreload = books.slice(0, PRELOAD_COUNT);

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
    }, [books, loadedImages]);

    // Focus management effect for search input
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isLoading]);

    const showLoadingState = isLoading && !isLoadingMore;

    // Early return for error state
    if (error) {
        return (
            <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-4 space-y-4 sm:space-y-6">
                <BookCollectionError error={error} onRetry={retry} />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-4 space-y-4 sm:space-y-6">
            {/* Controls Section */}
            <BookCollectionControls />

            {/* Filters Section */}
            <BookCollectionFilters
                searchTerm={searchTerm}
                onSearchChange={handleSearch}
                onSearchBlur={handleSearchBlur}
                audioFilter={filters.hasAudio}
                onAudioFilterChange={handleAudioFilterChange}
                disabled={showLoadingState}
                searchInputRef={searchInputRef}
            />

            {/* Books Grid/List */}
            <div className="min-h-[600px] transition-opacity duration-300">
                {isInitialLoad && showLoadingState ? (
                    <BookGridSkeleton count={localPagination?.perPage || 8} />
                ) : (
                    <div className="space-y-6 w-full">
                        {books && books.length > 0 ? (
                            <>
                                <BookCollectionGrid books={books} viewMode={viewMode} onSelectBook={selectBook} />

                                {/* Load More */}
                                <BookCollectionLoadMore
                                    hasMore={localPagination.total > books.length}
                                    isLoading={isLoadingMore}
                                    onLoadMore={loadMore}
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
