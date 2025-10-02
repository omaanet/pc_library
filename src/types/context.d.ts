// src/types/context.d.ts

import { Book, User, UserPreferences } from './index';

export type ViewMode = 'grid' | 'list';
export type SortBy = 'hasAudio' | 'title' | 'publishingDate' | 'audioLength';
export type SortOrder = 'asc' | 'desc';

export interface LibraryFilters {
    search?: string;
    hasAudio?: boolean;
    minAudioLength?: number;
    maxAudioLength?: number;
    displayPreviews?: number; // -1: all, 0: non-preview only, 1: preview only
}

export interface LibrarySort {
    by: SortBy;
    order: SortOrder;
}

export interface LibraryState {
    books: Book[];
    isLoading: boolean;
    error: Error | null;
    filters: LibraryFilters;
    sort: LibrarySort;
    viewMode: ViewMode;
    selectedBook: Book | null;
    pagination: {
        page: number;
        perPage: number;
        total: number;
    };
    isFiltersReady: boolean; // Indicates if filters have been loaded from localStorage
}

export type LibraryAction =
    | { type: 'SET_BOOKS'; payload: Book[] }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: Error | null }
    | { type: 'SET_FILTERS'; payload: LibraryFilters }
    | { type: 'SET_SORT'; payload: LibrarySort }
    | { type: 'SET_VIEW_MODE'; payload: ViewMode }
    | { type: 'SET_SELECTED_BOOK'; payload: Book | null }
    | { type: 'SET_PAGINATION'; payload: { page: number; perPage: number; total: number } }
    | { type: 'SET_FILTERS_READY'; payload: boolean };

export interface LibraryContextType {
    state: LibraryState;
    dispatch: React.Dispatch<LibraryAction>;
    selectBook: (book: Book | null) => void;
    updateFilters: (filters: Partial<LibraryFilters>) => void;
    updateSort: (sort: Partial<LibrarySort>) => void;
    setViewMode: (mode: ViewMode) => void;
}

export interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
    isAuthenticated: boolean;
}

export type AuthAction =
    | { type: 'SET_USER'; payload: User | null }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: Error | null }
    | { type: 'SET_AUTHENTICATED'; payload: boolean };

export interface LoginCredentials {
    email: string;
    password?: string; // Optional for new auth flow
}

export interface RegisterCredentials {
    email: string;
    fullName: string;
}

export interface RegisterResponse {
    success: boolean;
    message: string;
    redirectAfterSeconds?: number;
}

export interface AuthContextType {
    state: AuthState;
    dispatch: React.Dispatch<AuthAction>;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<RegisterResponse>;
    logout: () => Promise<void>;
    updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
}