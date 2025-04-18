// src/hooks/use-book-filters.ts
import { useCallback, useEffect, useState } from 'react';
import { useLibrary } from '@/context/library-context';
import type { LibraryFilters, LibrarySort, ViewMode } from '@/types/context';

export interface UseBookFiltersProps {
    initialFilters?: Partial<LibraryFilters>;
    initialSort?: Partial<LibrarySort>;
    initialViewMode?: ViewMode;
    debounceMs?: number;
}

export function useBookFilters({
    initialFilters = {},
    initialSort = {},
    initialViewMode = 'grid',
    debounceMs = 300,
}: UseBookFiltersProps = {}) {
    const {
        state: { filters, sort, viewMode },
        updateFilters,
        updateSort,
        setViewMode,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fetchBooks,
    } = useLibrary();

    const [debouncedSearch, setDebouncedSearch] = useState<NodeJS.Timeout>();
    const [isDebouncing, setIsDebouncing] = useState(false);

    // Initialize filters
    useEffect(() => {
        if (Object.keys(initialFilters).length > 0) {
            updateFilters(initialFilters);
        }
        if (Object.keys(initialSort).length > 0) {
            updateSort(initialSort);
        }
        if (initialViewMode !== viewMode) {
            setViewMode(initialViewMode);
        }
    }, [initialFilters, initialSort, initialViewMode, updateFilters, updateSort, setViewMode, viewMode]);

    // Handle search with debounce
    const handleSearch = useCallback((searchTerm: string) => {
        setIsDebouncing(true);
        if (debouncedSearch) {
            clearTimeout(debouncedSearch);
        }

        const timeoutId = setTimeout(() => {
            updateFilters({ search: searchTerm });
            setIsDebouncing(false);
        }, debounceMs);

        setDebouncedSearch(timeoutId);
    }, [debouncedSearch, debounceMs, updateFilters]);

    // Handle audio filter toggle
    const handleAudioFilter = useCallback((hasAudio: boolean) => {
        updateFilters({ hasAudio });
    }, [updateFilters]);

    // Handle sort change
    const handleSort = useCallback((sortValue: string) => {
        const [by, order] = sortValue.split('-') as [LibrarySort['by'], LibrarySort['order']];
        updateSort({ by, order });
    }, [updateSort]);

    // Handle view mode change
    const handleViewMode = useCallback((mode: ViewMode) => {
        setViewMode(mode);
    }, [setViewMode]);

    // Reset filters
    const resetFilters = useCallback(() => {
        updateFilters({});
        updateSort({ by: 'title', order: 'asc' });
    }, [updateFilters, updateSort]);

    return {
        filters,
        sort,
        viewMode,
        isDebouncing,
        handleSearch,
        handleAudioFilter,
        handleSort,
        handleViewMode,
        resetFilters,
    };
}