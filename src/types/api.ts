/**
 * API Response Type Definitions
 * Standard types for API request/response handling
 */

/**
 * Standard error response structure
 * All API routes should return errors in this format
 */
export interface ApiErrorResponse {
    error: string;
    details?: string | Record<string, any>;
    statusCode?: number;
}

/**
 * Generic success response wrapper
 * Can be used to wrap successful API responses with metadata
 */
export interface ApiSuccessResponse<T = any> {
    data: T;
    message?: string;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}
