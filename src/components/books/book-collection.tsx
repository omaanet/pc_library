// src/components/books/book-collection.tsx
'use client';

import * as React from 'react';
import { useLibrary } from '@/context/library-context';
import { useAuth } from '@/context/auth-context';
import { BookGridCard } from './book-grid-card';
import { BookListCard } from './book-list-card';
import { BookDialog } from './book-dialog';
import { ViewSwitcher } from '@/components/shared/view-switcher';
import { Button } from '@/components/ui/button';
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
import { Loader2 } from 'lucide-react';
import { BookGridSkeleton, BookListSkeleton } from '@/components/ui/loading-placeholder';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const SORT_OPTIONS = {
    'title-asc': { label: 'Title (A-Z)' },
    'title-desc': { label: 'Title (Z-A)' },
    'date-desc': { label: 'Newest First' },
    'date-asc': { label: 'Oldest First' },
} as const;

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

    const {
        state: { isAuthenticated },
    } = useAuth();

    const [searchDebounce, setSearchDebounce] = React.useState<NodeJS.Timeout>();
    const [isOperationLoading, setIsOperationLoading] = React.useState(false);

    // Initialize books on mount
    React.useEffect(() => {
        const loadBooks = async () => {
            try {
                await fetchBooks();
            } catch (error) {
                console.error('Failed to load books:', error);
            }
        };
        loadBooks();
    }, [fetchBooks]);

    // Debounced search handler
    const handleSearch = React.useCallback((value: string) => {
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }
        setSearchDebounce(
            setTimeout(() => {
                updateFilters({ search: value });
            }, 300)
        );
    }, [searchDebounce, updateFilters]);

    const handleSortChange = React.useCallback((value: string) => {
        const [by, order] = value.split('-') as ['title' | 'date', 'asc' | 'desc'];
        updateSort({ by, order });
    }, [updateSort]);

    const handleAudioFilterChange = React.useCallback((checked: boolean) => {
        updateFilters({ hasAudio: checked });
    }, [updateFilters]);

    // Handle auth requirement for book actions
    const handleBookAction = React.useCallback(async () => {
        if (!isAuthenticated) {
            setIsOperationLoading(true);
            try {
                // Your auth action here (e.g., opening auth modal)
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error('Auth action failed:', error);
            } finally {
                setIsOperationLoading(false);
            }
        }
    }, [isAuthenticated]);

    // Error state
    if (error) {
        return (
            <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Failed to load books. Please try again later.
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchBooks()}
                        className="mt-2"
                    >
                        Retry
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    const currentSortKey = `${sort.by}-${sort.order}`;

    return (
        <div className="space-y-6">
            {/* Controls Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Library Collection
                </h2>
                <div className="flex items-center gap-4">
                    <ViewSwitcher view={viewMode} onViewChange={setViewMode} />
                    <Select
                        value={currentSortKey}
                        onValueChange={handleSortChange}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by..." />
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
                        placeholder="Search books..."
                        onChange={(e) => handleSearch(e.target.value)}
                        defaultValue={filters.search}
                        className="max-w-xs"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Switch
                        id="audioFilter"
                        checked={filters.hasAudio}
                        onCheckedChange={handleAudioFilterChange}
                    />
                    <Label htmlFor="audioFilter">Audio Available</Label>
                </div>
            </div>

            {/* Loading indicator */}
            {isOperationLoading && (
                <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                </div>
            )}

            {/* Books Grid/List */}
            {isLoading ? (
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

                            {/* Pagination */}
                            {pagination && pagination.total > pagination.perPage && (
                                <div className="flex justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        disabled={pagination.page === 1 || isLoading}
                                        onClick={() => fetchBooks(pagination.page - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                                        Page {pagination.page} of{' '}
                                        {Math.ceil(pagination.total / pagination.perPage)}
                                    </span>
                                    <Button
                                        variant="outline"
                                        disabled={
                                            pagination.page >=
                                            Math.ceil(pagination.total / pagination.perPage) || isLoading
                                        }
                                        onClick={() => fetchBooks(pagination.page + 1)}
                                    >
                                        Next
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
                onLoginClick={handleBookAction}
            />
        </div>
    );
}