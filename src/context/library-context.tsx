/* eslint-disable no-console */
// src/context/library-context.tsx
'use client';

import * as React from 'react';
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type {
    LibraryState,
    LibraryAction,
    LibraryContextType,
    LibraryFilters,
    LibrarySort,
    ViewMode,
} from '@/types/context';
import type { Book } from '@/types';

// localStorage key for persisting filters
const FILTERS_STORAGE_KEY = 'bookLibrary_filters';

/**
 * Load filters from localStorage
 */
function loadFiltersFromStorage(): Partial<LibraryFilters> {
    if (typeof window === 'undefined') return {};
    
    try {
        const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to load filters from localStorage:', error);
    }
    
    return {};
}

/**
 * Save filters to localStorage
 */
function saveFiltersToStorage(filters: Partial<LibraryFilters>): void {
    if (typeof window === 'undefined') return;
    
    try {
        // Only persist specific filter properties (hasAudio and search)
        // Exclude undefined values to avoid storing them
        const filtersToPersist: Partial<LibraryFilters> = {};
        
        if (filters.hasAudio !== undefined) {
            filtersToPersist.hasAudio = filters.hasAudio;
        }
        
        if (filters.search !== undefined) {
            filtersToPersist.search = filters.search;
        }
        
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filtersToPersist));
    } catch (error) {
        console.error('Failed to save filters to localStorage:', error);
    }
}

// Create initial state with a function to handle SSR properly
function createInitialState(): LibraryState {
    // Always start with empty filters to match server-side render
    // Filters will be loaded from localStorage in useEffect after hydration
    return {
        books: [],
        isLoading: false,
        error: null,
        filters: {}, // Always start empty to avoid hydration mismatch
        sort: { by: 'hasAudio', order: 'desc' },
        viewMode: 'grid',
        selectedBook: null,
        pagination: {
            page: 1,
            perPage: -1,
            total: 0,
        },
        isFiltersReady: false, // Not ready until after hydration
    };
}

function libraryReducer(state: LibraryState, action: LibraryAction): LibraryState {
    switch (action.type) {
        case 'SET_BOOKS':
            return { ...state, books: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_FILTERS':
            return { ...state, filters: action.payload };
        case 'SET_SORT':
            return { ...state, sort: action.payload };
        case 'SET_VIEW_MODE':
            return { ...state, viewMode: action.payload };
        case 'SET_SELECTED_BOOK':
            return { ...state, selectedBook: action.payload };
        case 'SET_PAGINATION':
            return {
                ...state,
                pagination: {
                    ...state.pagination,
                    ...action.payload
                }
            };
        case 'SET_FILTERS_READY':
            return { ...state, isFiltersReady: action.payload };
        default:
            return state;
    }
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
    // Use lazy initialization to ensure localStorage is read on client-side only, once
    const [state, dispatch] = useReducer(libraryReducer, undefined, createInitialState);
    const [isReady, setIsReady] = React.useState(false);
    
    // Track last saved filters to avoid unnecessary writes
    const lastSavedFilters = React.useRef<string>(JSON.stringify({
        hasAudio: state.filters.hasAudio,
        search: state.filters.search,
    }));
    
    // Load filters from localStorage after hydration
    React.useEffect(() => {
        if (typeof window !== 'undefined' && !isReady) {
            const storedFilters = loadFiltersFromStorage();
            if (Object.keys(storedFilters).length > 0) {
                dispatch({ type: 'SET_FILTERS', payload: storedFilters });
                console.log('[LibraryContext] Filters loaded from localStorage:', storedFilters);
            }
            dispatch({ type: 'SET_FILTERS_READY', payload: true });
            setIsReady(true);
        }
    }, [isReady]);

    // Persist filters to localStorage whenever they change
    // Only save if filters actually changed to avoid unnecessary writes
    useEffect(() => {
        if (!isReady) return; // Don't save until we've loaded initial filters
        
        const currentFilters = JSON.stringify({
            hasAudio: state.filters.hasAudio,
            search: state.filters.search,
        });
        
        if (currentFilters !== lastSavedFilters.current) {
            saveFiltersToStorage(state.filters);
            lastSavedFilters.current = currentFilters;
        }
    }, [state.filters.hasAudio, state.filters.search, isReady]);

    // Note: Book fetching is handled by useBookData hook in components
    // Context only manages filter state, not data fetching

    const selectBook = useCallback((book: Book | null) => {
        dispatch({ type: 'SET_SELECTED_BOOK', payload: book });
    }, []);

    const updateFilters = useCallback((filters: Partial<LibraryFilters>) => {
        dispatch({
            type: 'SET_FILTERS',
            payload: { ...state.filters, ...filters },
        });
        // Data fetching is handled by useBookData hook which watches filter changes
    }, [state.filters]);

    const updateSort = useCallback((sort: Partial<LibrarySort>) => {
        dispatch({
            type: 'SET_SORT',
            payload: { ...state.sort, ...sort },
        });
        // Data fetching is handled by useBookData hook which watches sort changes
    }, [state.sort]);

    const setViewMode = useCallback((mode: ViewMode) => {
        dispatch({ type: 'SET_VIEW_MODE', payload: mode });
    }, []);

    // Memoize context value to prevent unnecessary rerenders
    const value = React.useMemo<LibraryContextType>(() => ({
        state,
        dispatch,
        selectBook,
        updateFilters,
        updateSort,
        setViewMode,
    }), [
        state,
        selectBook,
        updateFilters,
        updateSort,
        setViewMode
    ]);

    return (
        <LibraryContext.Provider value={value}>
            {children}
        </LibraryContext.Provider>
    );
}

export function useLibrary(): LibraryContextType {
    const context = useContext(LibraryContext);
    if (context === undefined) {
        throw new Error('useLibrary must be used within a LibraryProvider');
    }
    return context;
}