// src/lib/db/types.ts
// Type definitions for database queries

/**
 * Options for querying books with filtering, sorting, and pagination
 */
export interface BookQueryOptions {
    search?: string;
    hasAudio?: boolean;
    sortBy?: Array<[string, 'ASC' | 'DESC']> | string;
    sortOrder?: 'asc' | 'desc'; // Only used if sortBy is a string
    page?: number;
    perPage?: number;
    displayPreviews?: number; // -1: all, 0: non-preview only, 1: preview only
    displayOrder?: number;
    isVisible?: number;
}

/**
 * Generic paginated result wrapper
 */
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
    };
}
