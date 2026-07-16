// src/lib/image-utils.ts
import { DEFAULT_COVER_SIZES } from '@/types/images';
import type { ImageSize } from '@/types/images';

/**
 * Configuration for image handling
 */
export const IMAGE_CONFIG = {
    baseUrl: '/api/covers',
    placeholder: {
        token: '@placeholder',
    }
} as const;

/**
 * Options for cover image URL generation
 */
interface CoverImageOptions {
    /**
     * Optional book ID for placeholder generation
     * Helps create deterministic placeholders
     */
    bookId?: string;
    /**
     * Optional cache-busting value for immutable cover URLs.
     */
    cacheKey?: string | number | Date | null;
    /**
     * Optional processing mode for cover-specific rendering.
     */
    mode?: 'cover';
    /**
     * Avoid transparent letterboxing when the image is displayed inside a frame.
     */
    fit?: 'inside';
}

/**
 * Normalizes an image path for safe URL construction
 * Handles both real paths and placeholder tokens
 */
function normalizeImagePath(path: string): string {
    // Handle placeholder token as-is
    if (path === IMAGE_CONFIG.placeholder.token) {
        return path;
    }

    // Remove leading/trailing slashes and normalize path separators
    return path.replace(/^\/+|\/+$/g, '').replace(/\/{2,}/g, '/');
}

function appendImageQueryParams(url: string, options: CoverImageOptions): string {
    const queryParams = new URLSearchParams();

    if (options.bookId) {
        queryParams.set('bookId', options.bookId);
    }

    if (options.cacheKey) {
        queryParams.set('v', options.cacheKey instanceof Date ? options.cacheKey.toISOString() : String(options.cacheKey));
    }

    if (options.mode) {
        queryParams.set('mode', options.mode);
    }

    if (options.fit) {
        queryParams.set('fit', options.fit);
    }

    const queryString = queryParams.toString();
    return queryString ? `${url}?${queryString}` : url;
}

/**
 * Generates a URL for a cover image with appropriate dimensions
 * based on the view type (grid, list, detail).
 *
 * @param imagePath - Original image path or placeholder token
 * @param viewType - Type of view determining dimensions
 * @param options - Additional options for URL generation
 * @returns Complete URL for the image
 *
 * @example
 * // Real image path
 * getCoverImageUrl('books/fantasy/book1.jpg', 'grid')
 * // => '/api/covers/240/360/books/fantasy/book1.jpg'
 *
 * @example
 * // Placeholder with book ID
 * getCoverImageUrl('@placeholder', 'grid', { bookId: 'book-001' })
 * // => '/api/covers/240/360/@placeholder?bookId=book-001'
 */
export function getCoverImageUrl(
    imagePath: string,
    viewType: keyof typeof DEFAULT_COVER_SIZES,
    options: CoverImageOptions = {}
): string {
    // Default dimensions if viewType is not provided
    const { width = 300, height = 400 } = DEFAULT_COVER_SIZES[viewType] || {};

    const normalizedPath = normalizeImagePath(imagePath);

    // Handle placeholder requests without dimensions
    if (normalizedPath === IMAGE_CONFIG.placeholder.token) {
        return appendImageQueryParams(
            `${IMAGE_CONFIG.baseUrl}/${width}/${height}/${normalizedPath}`,
            options
        );
    }

    // Regular image path
    return appendImageQueryParams(
        `${IMAGE_CONFIG.baseUrl}/${width}/${height}/${normalizedPath}`,
        options
    );
}

/**
 * Generates the crawler-compatible JPEG used for social link previews.
 */
export function getSocialCoverImageUrl(
    imagePath: string,
    options: CoverImageOptions = {}
): string {
    const normalizedPath = normalizeImagePath(imagePath);
    const queryParams = new URLSearchParams({
        variant: 'social-classic-green-v1',
    });

    if (options.bookId) {
        queryParams.set('bookId', options.bookId);
    }

    if (options.cacheKey) {
        queryParams.set('v', options.cacheKey instanceof Date ? options.cacheKey.toISOString() : String(options.cacheKey));
    }

    return `${IMAGE_CONFIG.baseUrl}/1200/630/${normalizedPath}?${queryParams.toString()}`;
}

/**
 * Returns the appropriate size configuration for Next.js Image component
 * based on the view type.
 */
export function getImageSizeConfig(viewType: keyof typeof DEFAULT_COVER_SIZES): ImageSize {
    const { width, height } = DEFAULT_COVER_SIZES[viewType];
    return { width, height };
}
