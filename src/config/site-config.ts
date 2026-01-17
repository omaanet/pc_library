// src/config/site-config.ts
/**
 * General site configuration constants.
 * Centralizes site-wide settings like contact information to avoid duplication.
 */

// Contact email address - configurable based on environment for development vs production
export const SITE_CONFIG = {
    CONTACT_EMAIL: process.env.NODE_ENV === 'development' ? 'oscar@omaa.it' : 'info@raccontiinvoceecaratteri.it',

    BOOK_BADGES: {
        NEW_DAYS: 30,
    },

    /**
     * Pagination configuration for book queries and API responses
     * These constants ensure consistent pagination behavior across the application
     */
    PAGINATION: {
        /** Default page number for queries (1-indexed) */
        DEFAULT_PAGE: 1,
        /** Default number of items per page */
        DEFAULT_PER_PAGE: 10,
        /** Maximum allowed items per page (for validation) */
        MAX_PER_PAGE: 100,
        /** Minimum allowed items per page (for validation) */
        MIN_PER_PAGE: 1,
    },

    /**
     * Display preview filter constants for book collections
     * Controls which books are displayed based on their preview status
     */
    DISPLAY_PREVIEWS: {
        /** Show all books (both preview and non-preview) */
        ALL: -1,
        /** Show only non-preview books (full books) */
        NON_PREVIEW_ONLY: 0,
        /** Show only preview books */
        PREVIEW_ONLY: 1,
    },

    /**
     * Default sort order for book queries when no sortBy parameter is provided
     * This configuration allows changing the default sorting behavior without modifying code
     * 
     * Format: Array of [column, direction] tuples
     * - Column must be a valid sortable column from the books table
     * - Direction must be 'ASC' or 'DESC'
     * 
     * Current default behavior:
     * 1. Books with audio first (has_audio ASC)
     * 2. Then by display order (display_order ASC)
     * 3. Then newest books first (publishing_date DESC with NULLS LAST)
     * 
     * @example
     * // To prioritize newest books first instead:
     * DEFAULT_SORT: [
     *   ['publishing_date', 'DESC'],
     *   ['has_audio', 'ASC'],
     *   ['display_order', 'ASC']
     * ]
     */
    DEFAULT_SORT: [
        ['has_audio', 'ASC'],
        ['display_order', 'ASC'],
        ['publishing_date', 'DESC']
    ] as const,

    /**
     * Site metadata for copyright and attribution
     */
    METADATA: {
        AUTHOR: 'Oscar e Paolo Mucchiati',
        SITE_NAME: 'OMAA.net',
        SITE_URL: 'https://www.omaa.it',
        ESTABLISHED_YEAR: 2025,
    },

    /**
     * SQL condition to exclude internal and local IP addresses from statistics
     * to prevent data pollution from development and maintenance activities.
     * Handles NULL ip_address values by treating them as non-excluded.
     */
    AVOID_LOCAL_ADDRESS_POLLUTION: "(COALESCE(ip_address, '') <> '128.116.163.86' AND COALESCE(ip_address, '') <> '::1')",
} as const;
