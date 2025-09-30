// src/config/site-config.ts
/**
 * General site configuration constants.
 * Centralizes site-wide settings like contact information to avoid duplication.
 */

// Contact email address - configurable based on environment for development vs production
export const SITE_CONFIG = {
  CONTACT_EMAIL: process.env.NODE_ENV === 'development' ? 'oscar@omaa.it' : 'info@raccontiinvoceecaratteri.it',

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
} as const;
