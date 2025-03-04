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
    const { width, height } = DEFAULT_COVER_SIZES[viewType];
    const normalizedPath = normalizeImagePath(imagePath);

    // Construct the base URL with dimensions
    const baseUrl = `${IMAGE_CONFIG.baseUrl}/${width}/${height}/${normalizedPath}`;

    // Add query parameters for placeholder if needed
    if (normalizedPath === IMAGE_CONFIG.placeholder.token && options.bookId) {
        return `${baseUrl}?bookId=${encodeURIComponent(options.bookId)}`;
    }

    return baseUrl;
}

/**
 * Returns the appropriate size configuration for Next.js Image component
 * based on the view type.
 */
export function getImageSizeConfig(viewType: keyof typeof DEFAULT_COVER_SIZES): ImageSize {
    const { width, height } = DEFAULT_COVER_SIZES[viewType];
    return { width, height };
}