'use client';

import * as React from 'react';
import { useLibrary } from '@/context/library-context';
import { useAuth } from '@/context/auth-context';
import { BookGridCard } from './book-grid-card';
import { BookListCard } from './book-list-card';
import { BookDialog } from './book-dialog';
import { ViewSwitcher } from '@/components/shared/view-switcher';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookGridSkeleton, BookListSkeleton } from '@/components/ui/loading-placeholder';
import { DEFAULT_COVER_SIZES } from '@/types/images';
import type { LibrarySort } from '@/types/context';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';

const SORT_OPTIONS = {
    'title-asc': { label: 'Title (A-Z)' },
    'title-desc': { label: 'Title (Z-A)' },
    'date-desc': { label: 'Newest First' },
    'date-asc': { label: 'Oldest First' },
} as const;

// Number of books to preload images for
const PRELOAD_COUNT = 4;

export function BookCollection() {
    const {
        state: {
            books,
            isLoading,
            error,
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
    } = useLibrary();

    const { state: { isAuthenticated } } = useAuth();
    const { toast } = useToast();

    // Local loading states
    const [isSearching, setIsSearching] = React.useState(false);
    const [searchDebounce, setSearchDebounce] = React.useState<NodeJS.Timeout>();
    const [isLoadingMore, setIsLoadingMore] = React.useState(false);

    // Track loaded images
    const [loadedImages, setLoadedImages] = React.useState<Set<string>>(new Set());

    // Initialize books on mount
    React.useEffect(() => {
        const loadBooks = async () => {
            try {
                await fetchBooks();
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load books. Please try again.",
                });
            }
        };
        loadBooks();
    }, [fetchBooks, toast]);

    // Preload images for visible books
    React.useEffect(() => {
        if (!books || books.length === 0) return;

        const preloadImages = books.slice(0, PRELOAD_COUNT).map(book => {
            if (loadedImages.has(book.coverImage)) return Promise.resolve();

            return new Promise<void>((resolve) => {
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
    }, [books, loadedImages]);

    // Debounced search handler
    const handleSearch = React.useCallback((value: string) => {
        setIsSearching(true);
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }

        setSearchDebounce(
            setTimeout(async () => {
                try {
                    await updateFilters({ search: value });
                } finally {
                    setIsSearching(false);
                }
            }, 300)
        );
    }, [searchDebounce, updateFilters]);

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
        if (isLoadingMore || !pagination) return;

        setIsLoadingMore(true);
        try {
            await fetchBooks(pagination.page + 1);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, pagination, fetchBooks]);

    // Error state
    if (error) {
        return (
            <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                    <p>Failed to load books. Please try again later.</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchBooks()}
                        className="w-fit"
                    >
                        Retry
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    const showLoadingState = isLoading && !isLoadingMore;
    const currentSortKey = `${sort.by}-${sort.order}`;

    return (
        <div className="space-y-6">
            {/* Controls Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    <h2 className="text-2xl font-semibold tracking-tight">
                        Biblioteca
                    </h2>
                </div>
                <div className="flex items-center gap-4">
                    <ViewSwitcher view={viewMode} onViewChange={setViewMode} />
                    <Select
                        value={currentSortKey}
                        onValueChange={handleSortChange}
                        disabled={showLoadingState}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Ordina..." />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(SORT_OPTIONS).map(([key, { label }]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-wrap gap-4 rounded-lg border bg-card p-4">
                <div className="flex-1">
                    <Input
                        placeholder="Cerca libri..."
                        onChange={(e) => handleSearch(e.target.value)}
                        defaultValue={filters.search}
                        className="max-w-xs"
                        disabled={showLoadingState}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Switch
                        id="audioFilter"
                        checked={filters.hasAudio}
                        onCheckedChange={handleAudioFilterChange}
                        disabled={showLoadingState}
                    />
                    <Label htmlFor="audioFilter">Audio Disponibile</Label>
                </div>
            </div>

            {/* Loading indicator */}
            {isSearching && (
                <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching...</span>
                </div>
            )}

            {/* Books Grid/List */}
            {showLoadingState ? (
                viewMode === 'grid' ? (
                    <BookGridSkeleton count={pagination?.perPage || 8} />
                ) : (
                    <BookListSkeleton count={pagination?.perPage || 8} />
                )
            ) : (
                <div className="space-y-6">
                    {books && books.length > 0 ? (
                        <>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                                    {books.map((book) => (
                                        <BookGridCard
                                            key={book.id}
                                            book={book}
                                            onSelect={selectBook}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="divide-y rounded-lg border bg-card">
                                    {books.map((book) => (
                                        <BookListCard
                                            key={book.id}
                                            book={book}
                                            onSelect={selectBook}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Load More */}
                            {pagination && pagination.total > books.length && (
                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={handleLoadMore}
                                        disabled={isLoadingMore}
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            'Load More'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No books found. Try adjusting your search or filters.
                        </div>
                    )}
                </div>
            )}

            {/* Book Dialog */}
            <BookDialog
                book={selectedBook}
                open={!!selectedBook}
                onOpenChange={(open) => !open && selectBook(null)}
                isAuthenticated={isAuthenticated}
            />
        </div>
    );
}