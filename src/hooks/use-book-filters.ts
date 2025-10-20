// src/hooks/use-book-filters.ts
import { useCallback, useEffect, useState, useRef } from 'react';
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
    } = useLibrary();

    const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const [isDebouncing, setIsDebouncing] = useState(false);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

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
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            updateFilters({ search: searchTerm });
            setIsDebouncing(false);
        }, debounceMs);
    }, [debounceMs, updateFilters]);

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