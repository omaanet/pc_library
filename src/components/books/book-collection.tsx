'use client';

import * as React from 'react';
import { useLibrary } from '@/context/library-context';
import { useAuth } from '@/context/auth-context';
import { BookGridCard } from './book-grid-card';
import { BookListCard } from './book-list-card';
import { BookDialog, BookDialogSimple } from './book-dialog';
// import { ViewSwitcher } from '@/components/shared/view-switcher';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle, BookOpen, Headphones } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookGridSkeleton, BookListSkeleton } from '@/components/ui/loading-placeholder';
// import { DEFAULT_COVER_SIZES } from '@/types/images';
import type { LibrarySort } from '@/types/context';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';
import { AuthModal } from '@/components/auth/auth-modal';
import type { BookResponse } from '@/types';

const SORT_OPTIONS = {
    'title-asc': { label: 'Title (A-Z)' },
    'title-desc': { label: 'Title (Z-A)' },
    'date-desc': { label: 'Newest First' },
    'date-asc': { label: 'Oldest First' },
} as const;

// Number of books to preload images for
const PRELOAD_COUNT = 4;

interface BookCollectionProps {
    displayPreviews: number; // -1: all, 0: non-preview only, 1: preview only
}

export function BookCollection({ displayPreviews }: BookCollectionProps) {
    // Use a local state for books to avoid sharing between multiple instances
    const [localBooks, setLocalBooks] = React.useState<any[]>([]);
    const [localIsLoading, setLocalIsLoading] = React.useState(false);
    const [localError, setLocalError] = React.useState<Error | null>(null);
    const [localPagination, setLocalPagination] = React.useState({
        page: 1,
        perPage: 10,
        total: 0,
        totalPages: 0
    });

    const {
        state: {
            viewMode,
            selectedBook,
            filters,
            sort,
            pagination,
        },
        fetchBooks,
        selectBook,
        updateFilters,
        updateSort,
        setViewMode,
        dispatch,
    } = useLibrary();

    const { state: { isAuthenticated } } = useAuth();
    const { toast } = useToast();

    // Add state for the auth modal
    const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);

    // Local loading states
    const [searchDebounce, setSearchDebounce] = React.useState<NodeJS.Timeout>();
    const [isLoadingMore, setIsLoadingMore] = React.useState(false);

    // Track loaded images
    const [loadedImages, setLoadedImages] = React.useState<Set<string>>(new Set());

    // Local search state to prevent unnecessary context updates
    const [searchTerm, setSearchTerm] = React.useState<string>(filters.search || '');
    const [lastSearched, setLastSearched] = React.useState<string>(filters.search || '');

    // Reference to search input element
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Initialize books on mount and when displayPreviews changes
    React.useEffect(() => {
        let isMounted = true;

        const loadBooks = async () => {
            setLocalIsLoading(true);

            // console.log('Loading books with displayPreviews:', displayPreviews);
            try {
                // Build query params with existing filters plus displayPreviews
                const params = new URLSearchParams({
                    page: '1',
                    perPage: pagination.perPage.toString(),
                    sortBy: sort.by,
                    sortOrder: sort.order,
                    displayPreviews: displayPreviews.toString(),
                    isVisible: '1'
                });

                // Add other filters
                if (filters.search) {
                    params.append('search', filters.search);
                }
                if (filters.hasAudio !== undefined) {
                    params.append('hasAudio', filters.hasAudio.toString());
                }

                // Fetch books directly from API
                const response = await fetch(`/api/books?${params}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: BookResponse = await response.json();
                // console.log('Fetched books for displayPreviews', displayPreviews, ':', data);

                // Only update local state if component is still mounted
                if (isMounted) {
                    setLocalBooks(data.books);

                    if (data.pagination) {
                        setLocalPagination(data.pagination);
                    }
                }
            } catch (error) {
                if (isMounted) {
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to load books. Please try again."
                    });
                    setLocalError(error instanceof Error ? error : new Error('Failed to fetch books'));
                }
            } finally {
                if (isMounted) {
                    setLocalIsLoading(false);
                }
            }
            // console.log('Finished loading books for displayPreviews:', displayPreviews);
        };

        loadBooks();

        // Cleanup function to prevent updates if component unmounts
        return () => {
            isMounted = false;
        };
    }, [displayPreviews, filters, pagination.perPage, sort.by, sort.order, toast]);

    // Preload book cover images for visible books
    React.useEffect(() => {
        if (!localBooks || localBooks.length === 0) return;

        // Only preload a limited number of books
        const booksToPreload = localBooks.slice(0, PRELOAD_COUNT);

        // Skip already loaded images
        const unloadedBooks = booksToPreload.filter(book => {
            return !loadedImages.has(book.coverImage);
        });

        if (unloadedBooks.length === 0) return;

        const preloadImages = unloadedBooks.map(book => {
            return new Promise<void>(resolve => {
                const img = new Image();
                img.onload = () => {
                    setLoadedImages(prev => new Set([...prev, book.coverImage]));
                    resolve();
                };
                img.onerror = () => resolve(); // Don't block on error

                // Use getCoverImageUrl to properly handle placeholder images
                const isPlaceholder = book.coverImage === IMAGE_CONFIG.placeholder.token;
                const imageUrl = getCoverImageUrl(
                    book.coverImage,
                    'grid', // Use grid size for preloading
                    { bookId: isPlaceholder ? book.id : undefined }
                );
                img.src = imageUrl;
            });
        });

        Promise.all(preloadImages).catch(console.error);
    }, [localBooks, loadedImages]);

    // Single focus management effect for search input
    React.useEffect(() => {
        // Focus on the input when searching state changes (both start and end)
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [localIsLoading]);

    // Validate search term (must be empty or at least 3 characters)
    const isValidSearch = React.useCallback((value: string) => {
        return value.length === 0 || value.length >= 3;
    }, []);

    // Perform the actual search with local state management to maintain focus
    const performSearch = React.useCallback(async (value: string) => {
        if (!isValidSearch(value)) {
            return;
        }

        // Don't perform a search if the value is already the last searched term
        if (value === lastSearched) {
            return;
        }

        try {
            // setIsSearching(true);
            // Store the search term locally
            // setSearchTerm(value);

            // Update the last searched term
            setLastSearched(value);

            // Build query params for this specific search request
            const params = new URLSearchParams({
                page: '1',
                perPage: pagination.perPage.toString(),
                sortBy: sort.by,
                sortOrder: sort.order,
                displayPreviews: displayPreviews.toString(),
                search: value,
                isVisible: '1'
            });

            // Add other existing filters
            if (filters.hasAudio !== undefined) {
                params.append('hasAudio', filters.hasAudio.toString());
            }

            // Directly fetch books to avoid context refresh
            // setLocalIsLoading(true);
            const response = await fetch(`/api/books?${params}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: BookResponse = await response.json();

            // Update local state first
            setLocalBooks(data.books || []);
            if (data.pagination) {
                setLocalPagination({
                    page: data.pagination.page,
                    perPage: data.pagination.perPage,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages || Math.ceil(data.pagination.total / data.pagination.perPage)
                });
            }

            // Only update local filter state, don't trigger context changes
            // This prevents unnecessary re-renders
        } catch (error) {
            console.error('Search error:', error);
            setLocalError(error instanceof Error ? error : new Error('Search failed'));
        } finally {

        }
    }, [displayPreviews, filters, pagination.perPage, sort.by, sort.order, lastSearched]);

    // Debounced handler for onChange events
    const handleSearch = React.useCallback((value: string) => {
        // Update the input value immediately for responsiveness
        setSearchTerm(value);

        // Don't proceed with API call if search term is invalid
        if (!isValidSearch(value)) {
            return;
        }

        // Clear previous timeout if it exists
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }

        // Set new timeout for debounced search
        setSearchDebounce(
            setTimeout(() => {
                performSearch(value);
            }, 600)
        );
    }, [searchDebounce, isValidSearch, performSearch]);

    // Handle blur event to immediately trigger search
    const handleSearchBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Don't proceed if search term is invalid
        if (!isValidSearch(value)) {
            return;
        }

        // Clear any pending debounce
        if (searchDebounce) {
            clearTimeout(searchDebounce);
            setSearchDebounce(undefined);
        }

        // Execute search immediately
        performSearch(value);
    }, [searchDebounce, isValidSearch, performSearch]);

    // Sort handler
    const handleSortChange = React.useCallback((value: string) => {
        const [by, order] = value.split('-') as [LibrarySort['by'], LibrarySort['order']];
        updateSort({ by, order });
    }, [updateSort]);

    // Audio filter handler
    const handleAudioFilterChange = React.useCallback((checked: boolean) => {
        updateFilters({ hasAudio: checked });
    }, [updateFilters]);

    // Load more handler
    const handleLoadMore = React.useCallback(async () => {
        if (localIsLoading || isLoadingMore || localPagination.page >= localPagination.totalPages) return;

        setIsLoadingMore(true);
        try {
            // Build query params with existing filters plus displayPreviews
            const params = new URLSearchParams({
                page: (localPagination.page + 1).toString(),
                perPage: pagination.perPage.toString(),
                sortBy: sort.by,
                sortOrder: sort.order,
                displayPreviews: displayPreviews.toString(),
                isVisible: '1'
            });

            // Add other filters
            if (filters.search) {
                params.append('search', filters.search);
            }
            if (filters.hasAudio !== undefined) {
                params.append('hasAudio', filters.hasAudio.toString());
            }

            // Fetch books directly from API
            const response = await fetch(`/api/books?${params}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: BookResponse = await response.json();

            // Append new books to existing ones
            setLocalBooks(prev => [...prev, ...data.books]);

            if (data.pagination) {
                setLocalPagination(data.pagination);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load more books. Please try again."
            });
        } finally {
            setIsLoadingMore(false);
        }
    }, [localIsLoading, isLoadingMore, localPagination, pagination.perPage, sort.by, sort.order, filters, displayPreviews, toast]);

    // Error state
    if (localError) {
        return (
            <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                    <p>Failed to load books. Please try again later.</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setLocalError(null);
                            setLocalIsLoading(true);
                            // Trigger a reload
                            const loadBooks = async () => {
                                try {
                                    const params = new URLSearchParams({
                                        page: '1',
                                        perPage: pagination.perPage.toString(),
                                        sortBy: sort.by,
                                        sortOrder: sort.order,
                                        displayPreviews: displayPreviews.toString(),
                                        isVisible: '1'
                                    });

                                    if (filters.search) {
                                        params.append('search', filters.search);
                                    }
                                    if (filters.hasAudio !== undefined) {
                                        params.append('hasAudio', filters.hasAudio.toString());
                                    }

                                    const response = await fetch(`/api/books?${params}`);
                                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                                    const data: BookResponse = await response.json();
                                    setLocalBooks(data.books);
                                    if (data.pagination) setLocalPagination(data.pagination);
                                } catch (error) {
                                    setLocalError(error instanceof Error ? error : new Error('Failed to fetch books'));
                                } finally {
                                    setLocalIsLoading(false);
                                }
                            };
                            loadBooks();
                        }}
                        className="w-fit"
                    >
                        Retry
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    const showLoadingState = localIsLoading && !isLoadingMore;
    // const currentSortKey = `${sort.by}-${sort.order}`;

    return (
        <div className="space-y-4 sm:space-y-6 w-100 mx-2 md:mx-0">
            {/* Controls Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-baseline gap-4">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                    <h2 className="text-2xl sm:text-3xl font-medium tracking-normal">
                        Biblioteca
                    </h2>
                </div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-wrap gap-4 rounded-lg border bg-card px-4 py-2 sm:py-4 w-100">
                <div className="flex-1">
                    <Input
                        ref={searchInputRef}
                        placeholder="Cerca racconti..."
                        onChange={(e) => handleSearch(e.target.value)}
                        onBlur={handleSearchBlur}
                        value={searchTerm}
                        className="max-w-lg"
                        disabled={showLoadingState}
                    />
                </div>
                <div className="flex flex-row flex-nowrap items-center gap-2 hover:text-yellow-400 cursor-pointer select-none">
                    <Switch
                        id="audioFilter"
                        checked={filters.hasAudio}
                        onCheckedChange={handleAudioFilterChange}
                        disabled={showLoadingState}
                    />
                    <Label htmlFor="audioFilter" className="flex flex-row items-center gap-2"><Headphones className="h-4 w-4" />solo Audio Racconti</Label>
                </div>
            </div>

            {/* Books Grid/List */}
            {showLoadingState ? (
                viewMode === 'grid' ? (
                    <BookGridSkeleton count={localPagination?.perPage || 8} />
                ) : (
                    <BookListSkeleton count={localPagination?.perPage || 8} />
                )
            ) : (
                <div className="space-y-6 w-100">
                    {localBooks && localBooks.length > 0 ? (
                        <>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 w-100">
                                    {localBooks.map((book) => (
                                        <BookGridCard
                                            key={book.id}
                                            book={book}
                                            onSelect={selectBook}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="divide-y rounded-lg border bg-card w-100">
                                    {localBooks.map((book) => (
                                        <BookListCard
                                            key={book.id}
                                            book={book}
                                            onSelect={selectBook}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Load More */}
                            {localPagination && localPagination.total > localBooks.length && (
                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={handleLoadMore}
                                        disabled={isLoadingMore}
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Caricamento...
                                            </>
                                        ) : (
                                            'Carica altro'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Nessun libro trovato. Prova a modificare la ricerca o i filtri.
                        </div>
                    )}
                </div>
            )}

            {/* Book Dialog */}
            <BookDialogSimple
                book={selectedBook}
                open={!!selectedBook}
                onOpenChange={(open) => !open && selectBook(null)}
                isAuthenticated={isAuthenticated}
                onLoginClick={() => {
                    // console.log('BookCollection: Setting auth modal open');
                    setIsAuthModalOpen(true);
                }}
            />
            {/* <BookDialog
                book={selectedBook}
                open={!!selectedBook}
                onOpenChange={(open) => !open && selectBook(null)}
                isAuthenticated={isAuthenticated}
                onLoginClick={() => {
                    setIsAuthModalOpen(true);
                }}
            /> */}

            {/* Auth Modal */}
            <AuthModal
                open={isAuthModalOpen}
                onOpenChange={setIsAuthModalOpen}
            />
        </div>
    );
}