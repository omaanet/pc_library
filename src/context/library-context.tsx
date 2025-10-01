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
    return {
        books: [],
        isLoading: false,
        error: null,
        filters: {}, // Start with empty filters to avoid hydration mismatch
        sort: { by: 'hasAudio', order: 'desc' },
        viewMode: 'grid',
        selectedBook: null,
        pagination: {
            page: 1,
            perPage: -1,
            total: 0,
        },
        isFiltersReady: false, // Filters not loaded yet
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
    const [state, dispatch] = useReducer(libraryReducer, createInitialState());
    const [isReady, setIsReady] = React.useState(false);
    
    // Track last saved filters to avoid unnecessary writes
    const lastSavedFilters = React.useRef<string>('{}');
    
    // Load filters from localStorage BEFORE first render using useLayoutEffect
    // This runs synchronously after DOM mutations but before browser paint
    React.useLayoutEffect(() => {
        if (typeof window !== 'undefined') {
            const storedFilters = loadFiltersFromStorage();
            console.log('[LibraryContext] Loading filters from localStorage:', storedFilters);
            if (Object.keys(storedFilters).length > 0) {
                dispatch({ type: 'SET_FILTERS', payload: storedFilters });
                lastSavedFilters.current = JSON.stringify({
                    hasAudio: storedFilters.hasAudio,
                    search: storedFilters.search,
                });
            }
            // Mark filters as ready - this will trigger child effects to run
            dispatch({ type: 'SET_FILTERS_READY', payload: true });
            setIsReady(true);
            console.log('[LibraryContext] Filters loaded, isFiltersReady set to true');
        }
    }, []);

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

    const fetchBooks = useCallback(async (page: number = 1, displayPreviewsParam?: number) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            // Construct URL parameters
            const params = new URLSearchParams({
                page: page.toString(),
                perPage: state.pagination.perPage.toString(),
                sortBy: state.sort.by,
                sortOrder: state.sort.order,
                isVisible: '1'
            });

            // Add filter parameters if they exist
            if (state.filters.search) {
                params.append('search', state.filters.search);
            }
            if (state.filters.hasAudio !== undefined) {
                params.append('hasAudio', state.filters.hasAudio.toString());
            }

            // Add displayPreviews parameter if provided directly (not from filters)
            if (displayPreviewsParam !== undefined) {
                params.append('displayPreviews', displayPreviewsParam.toString());
            } else if (state.filters.displayPreviews !== undefined) {
                params.append('displayPreviews', state.filters.displayPreviews.toString());
            }

            // Log request for debugging
            console.log('Fetching books with params:', params.toString());

            // Make the request
            const response = await fetch(`/api/books?${params}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Validate response data
            if (!data || !Array.isArray(data.books)) {
                throw new Error('Invalid response format');
            }

            // Update state with fetched data
            dispatch({ type: 'SET_BOOKS', payload: data.books });

            // Update pagination if provided
            if (data.pagination) {
                dispatch({
                    type: 'SET_PAGINATION',
                    payload: {
                        page: data.pagination.page,
                        perPage: data.pagination.perPage,
                        total: data.pagination.total,
                    },
                });
            }
        } catch (error) {
            console.error('Error fetching books:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: error instanceof Error ? error : new Error('Failed to fetch books')
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.pagination.perPage, state.sort, state.filters]);

    const selectBook = useCallback((book: Book | null) => {
        dispatch({ type: 'SET_SELECTED_BOOK', payload: book });
    }, []);

    const updateFilters = useCallback((filters: Partial<LibraryFilters>) => {
        dispatch({
            type: 'SET_FILTERS',
            payload: { ...state.filters, ...filters },
        });
        // Reset to first page when filters change
        fetchBooks(1).catch(console.error);
    }, [state.filters, fetchBooks]);

    const updateSort = useCallback((sort: Partial<LibrarySort>) => {
        dispatch({
            type: 'SET_SORT',
            payload: { ...state.sort, ...sort },
        });
        // Reset to first page when sort changes
        fetchBooks(1).catch(console.error);
    }, [state.sort, fetchBooks]);

    const setViewMode = useCallback((mode: ViewMode) => {
        dispatch({ type: 'SET_VIEW_MODE', payload: mode });
    }, []);

    // Memoize context value to prevent unnecessary rerenders
    const value = React.useMemo<LibraryContextType>(() => ({
        state,
        dispatch,
        fetchBooks,
        selectBook,
        updateFilters,
        updateSort,
        setViewMode,
    }), [
        state,
        fetchBooks,
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