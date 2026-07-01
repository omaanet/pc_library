import type { BookResponse } from '@/types';
import type { LibraryFilters } from '@/types/context';
import type { BookSortPreset } from '@/lib/book-sort';
import { SITE_CONFIG } from '@/config/site-config';

export interface FetchBooksParams {
  page?: number;
  perPage: number;
  sortPreset?: BookSortPreset;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  displayPreviews: number;
  filters?: LibraryFilters;
}

export interface PreviewBooksParams {
  sortOrder?: 'asc' | 'desc';
  isVisible?: number;
}

/**
 * Service layer for book API operations.
 * Centralizes all /api/books API calls and URL parameter construction.
 */
export const bookApiService = {
  /**
   * Builds URL search parameters for book API requests
   */
  buildParams(params: FetchBooksParams): URLSearchParams {
    const {
      page = SITE_CONFIG.PAGINATION.DEFAULT_PAGE,
      perPage,
      sortPreset,
      sortBy,
      sortOrder,
      displayPreviews,
      filters = {},
    } = params;

    const urlParams = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
      displayPreviews: displayPreviews.toString(),
      isVisible: '1',
    });

    if (sortPreset) {
      urlParams.set('sortPreset', sortPreset);
    }
    if (sortBy) {
      urlParams.set('sortBy', sortBy);
    }
    if (sortOrder) {
      urlParams.set('sortOrder', sortOrder);
    }

    // Add filter parameters if they exist
    if (filters.search) {
      urlParams.append('search', filters.search);
    }
    if (filters.hasAudio !== undefined) {
      urlParams.append('hasAudio', filters.hasAudio.toString());
    }

    return urlParams;
  },

  /**
   * Fetches books from the API
   * 
   * @param params - Request parameters
   * @returns Promise resolving to BookResponse
   * @throws Error if the request fails
   */
  async fetchBooks(params: FetchBooksParams): Promise<BookResponse> {
    const urlParams = this.buildParams(params);
    const response = await fetch(`/api/books?${urlParams}`, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Searches for books with a specific search term
   * 
   * @param params - Request parameters including search term in filters
   * @returns Promise resolving to BookResponse
   */
  async searchBooks(params: FetchBooksParams): Promise<BookResponse> {
    return this.fetchBooks({ ...params, page: 1 });
  },

  /**
   * Loads more books for pagination
   * 
   * @param params - Request parameters with incremented page number
   * @returns Promise resolving to BookResponse
   */
  async loadMoreBooks(params: FetchBooksParams): Promise<BookResponse> {
    return this.fetchBooks(params);
  },

  /**
   * Fetches preview books from the API
   * Preview books are books marked with isPreview flag for promotional purposes
   * 
   * @param params - Optional parameters for sorting and visibility filtering
   * @returns Promise resolving to BookResponse containing preview books
   * @throws Error if the request fails
   */
  async fetchPreviewBooks(params: PreviewBooksParams = {}): Promise<BookResponse> {
    const { sortOrder = 'desc', isVisible = 1 } = params;

    const urlParams = new URLSearchParams({
      displayPreviews: SITE_CONFIG.DISPLAY_PREVIEWS.PREVIEW_ONLY.toString(),
      sortOrder,
      isVisible: isVisible.toString(),
    });

    const response = await fetch(`/api/books?${urlParams}`, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Failed to fetch preview books: ${response.status}`);
    }

    return response.json();
  },
};
