// src/lib/db/types.ts
// Type definitions for database queries

/**
 * Options for querying books with filtering, sorting, and pagination
 * 
 * @example
 * ```typescript
 * import { SITE_CONFIG } from '@/config/site-config';
 * 
 * const options: BookQueryOptions = {
 *   page: SITE_CONFIG.PAGINATION.DEFAULT_PAGE,
 *   perPage: SITE_CONFIG.PAGINATION.DEFAULT_PER_PAGE,
 *   search: 'fantasy',
 *   sortBy: 'recent'
 * };
 * ```
 */
export interface BookQueryOptions {
    /** Search term to filter books by title or content */
    search?: string;
    /** Filter by audio availability */
    hasAudio?: boolean;
    /** Sort column(s) - array format or string (e.g., 'recent', 'top_rated') */
    sortBy?: Array<[string, 'ASC' | 'DESC']> | string;
    /** Sort direction - only used if sortBy is a string. Default: 'desc' */
    sortOrder?: 'asc' | 'desc';
    /** Page number (1-indexed). Default: SITE_CONFIG.PAGINATION.DEFAULT_PAGE */
    page?: number;
    /** Items per page. Default: SITE_CONFIG.PAGINATION.DEFAULT_PER_PAGE */
    perPage?: number;
    /** Preview filter: -1 = all, 0 = non-preview only, 1 = preview only. Default: 0 */
    displayPreviews?: number;
    /** Display order for sorting (reserved for future use) */
    displayOrder?: number;
    /** Visibility filter: 1 = visible, 0 = hidden, -1 = all. Default: 1 */
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
