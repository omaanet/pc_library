// src/context/library-context.tsx
'use client';

import * as React from 'react';
import { createContext, useContext, useReducer, useCallback } from 'react';
import type {
    LibraryState,
    LibraryAction,
    LibraryContextType,
    LibraryFilters,
    LibrarySort,
    ViewMode,
} from '@/types/context';
import type { Book } from '@/types';

const initialState: LibraryState = {
    books: [],
    isLoading: false,
    error: null,
    filters: {},
    sort: { by: 'title', order: 'asc' },
    viewMode: 'grid',
    selectedBook: null,
    pagination: {
        page: 1,
        perPage: 20,
        total: 0,
    },
};

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
            return { ...state, pagination: action.payload };
        default:
            return state;
    }
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(libraryReducer, initialState);

    const fetchBooks = useCallback(async (page: number = 1) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const params = new URLSearchParams();

            // Add pagination params
            params.append('page', page.toString());
            params.append('perPage', state.pagination.perPage.toString());

            // Add sort params
            params.append('sortBy', state.sort.by);
            params.append('sortOrder', state.sort.order);

            // Add filter params if they exist
            if (state.filters.search) {
                params.append('search', state.filters.search);
            }
            if (state.filters.hasAudio !== undefined) {
                params.append('hasAudio', state.filters.hasAudio.toString());
            }
            if (state.filters.minAudioLength !== undefined) {
                params.append('minAudioLength', state.filters.minAudioLength.toString());
            }
            if (state.filters.maxAudioLength !== undefined) {
                params.append('maxAudioLength', state.filters.maxAudioLength.toString());
            }

            const response = await fetch(`/api/books?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch books');

            const data = await response.json();
            dispatch({ type: 'SET_BOOKS', payload: data.books });
            dispatch({
                type: 'SET_PAGINATION',
                payload: {
                    page: data.page,
                    perPage: data.perPage,
                    total: data.total,
                },
            });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error as Error });
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
    }, [state.filters]);

    const updateSort = useCallback((sort: Partial<LibrarySort>) => {
        dispatch({
            type: 'SET_SORT',
            payload: { ...state.sort, ...sort },
        });
    }, [state.sort]);

    const setViewMode = useCallback((mode: ViewMode) => {
        dispatch({ type: 'SET_VIEW_MODE', payload: mode });
    }, []);

    const value: LibraryContextType = {
        state,
        dispatch,
        fetchBooks,
        selectBook,
        updateFilters,
        updateSort,
        setViewMode,
    };

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