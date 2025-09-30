import type { BookResponse } from '@/types';
import type { LibraryFilters, LibrarySort } from '@/types/context';

export interface FetchBooksParams {
  page?: number;
  perPage: number;
  sortBy: string;
  sortOrder: string;
  displayPreviews: number;
  filters?: LibraryFilters;
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
    const { page = 1, perPage, sortBy, sortOrder, displayPreviews, filters = {} } = params;

    const urlParams = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
      sortBy,
      sortOrder,
      displayPreviews: displayPreviews.toString(),
      isVisible: '1',
    });

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
    const response = await fetch(`/api/books?${urlParams}`);

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
};
