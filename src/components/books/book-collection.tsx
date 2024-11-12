/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/books/book-collection.tsx
'use client';

import * as React from 'react';
import { useLibrary } from '@/context/library-context';
import { useAuth } from '@/context/auth-context';
import { BookGridCard } from './book-grid-card';
import { BookListCard } from './book-list-card';
import { BookDetailsDialog } from './book-details-dialog';
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
import type { SortBy, SortOrder } from '@/types/context';

const SORT_OPTIONS = {
    'title-asc': { by: 'title' as const, order: 'asc' as const, label: 'Title (A-Z)' },
    'title-desc': { by: 'title' as const, order: 'desc' as const, label: 'Title (Z-A)' },
    'date-desc': { by: 'date' as const, order: 'desc' as const, label: 'Newest First' },
    'date-asc': { by: 'date' as const, order: 'asc' as const, label: 'Oldest First' },
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

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

    React.useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    const handleSearch = (value: string) => {
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }
        setSearchDebounce(
            setTimeout(() => {
                updateFilters({ search: value });
            }, 300)
        );
    };

    const handleSortChange = (value: string) => {
        const option = SORT_OPTIONS[value as SortKey];
        if (option) {
            updateSort({ by: option.by, order: option.order });
        }
    };

    const handleAudioFilterChange = (checked: boolean) => {
        updateFilters({ hasAudio: checked });
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-destructive mb-4">Error loading books: {error.message}</p>
                <Button onClick={() => fetchBooks()}>Try Again</Button>
            </div>
        );
    }

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
                        value={`${sort.by}-${sort.order}`}
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

            {/* Books Grid/List */}
            {isLoading ? (
                viewMode === 'grid' ? (
                    <BookGridSkeleton count={pagination.perPage} />
                ) : (
                    <BookListSkeleton count={pagination.perPage} />
                )
            ) : (
                <div className="space-y-6">
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
                    {pagination.total > pagination.perPage && (
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
                                    Math.ceil(
                                        pagination.total / pagination.perPage
                                    ) || isLoading
                                }
                                onClick={() => fetchBooks(pagination.page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Book Details Dialog */}
            <BookDetailsDialog
                book={selectedBook}
                open={!!selectedBook}
                onOpenChange={(open) => !open && selectBook(null)}
                isAuthenticated={isAuthenticated}
            />
        </div>
    );
}