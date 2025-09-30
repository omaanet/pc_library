/**
 * Standardized API Error Handling Utility
 * Provides consistent error response formatting across all API routes
 */

import { NextResponse } from 'next/server';

/**
 * Custom API Error class with HTTP status code
 */
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public details?: string | Record<string, any>
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
    error: string;
    details?: string | Record<string, any>;
    statusCode?: number;
}

/**
 * Creates a standardized error response object
 * @param message - Main error message
 * @param details - Optional additional error details
 * @param statusCode - Optional HTTP status code (for logging/debugging)
 * @returns Standardized error response object
 */
export function createErrorResponse(
    message: string,
    details?: string | Record<string, any>,
    statusCode?: number
): ErrorResponse {
    const response: ErrorResponse = {
        error: message
    };

    if (details !== undefined) {
        response.details = details;
    }

    if (statusCode !== undefined) {
        response.statusCode = statusCode;
    }

    return response;
}

/**
 * Handles API errors and returns a standardized NextResponse
 * @param error - Error object (can be ApiError, Error, or unknown)
 * @param defaultMessage - Default message if error message is not available
 * @param defaultStatusCode - Default HTTP status code (default: 500)
 * @returns NextResponse with standardized error format
 */
export function handleApiError(
    error: unknown,
    defaultMessage: string = 'An unexpected error occurred',
    defaultStatusCode: number = 500
): NextResponse {
    // Handle ApiError instances
    if (error instanceof ApiError) {
        return NextResponse.json(
            createErrorResponse(error.message, error.details, error.statusCode),
            { status: error.statusCode }
        );
    }

    // Handle standard Error instances
    if (error instanceof Error) {
        return NextResponse.json(
            createErrorResponse(error.message, undefined, defaultStatusCode),
            { status: defaultStatusCode }
        );
    }

    // Handle unknown error types
    const errorMessage = typeof error === 'string' ? error : defaultMessage;
    return NextResponse.json(
        createErrorResponse(errorMessage, undefined, defaultStatusCode),
        { status: defaultStatusCode }
    );
}

/**
 * Creates a success response with data
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 * @returns NextResponse with data
 */
export function createSuccessResponse<T>(
    data: T,
    statusCode: number = 200
): NextResponse {
    return NextResponse.json(data, { status: statusCode });
}

/**
 * Common HTTP status codes for API responses
 */
export const HttpStatus = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
} as const;
