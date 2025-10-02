import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseBookSearchParams {
  onSearch: (searchTerm: string) => void;
  debounceMs?: number;
  minSearchLength?: number;
  initialSearchTerm?: string;
}

export interface UseBookSearchReturn {
  searchTerm: string;
  handleSearch: (value: string) => void;
  handleSearchBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  isValidSearch: (value: string) => boolean;
  setSearchTerm: (value: string) => void;
}

/**
 * Custom hook for managing search functionality with debouncing.
 * Persistence is handled by the library context, not this hook.
 * 
 * @param params - Configuration object
 * @param params.onSearch - Callback function to execute when search is triggered
 * @param params.debounceMs - Debounce delay in milliseconds (default: 600)
 * @param params.minSearchLength - Minimum search term length (default: 3, 0 for empty is always valid)
 * @param params.initialSearchTerm - Initial search term from context (for persistence)
 * @returns Object containing search state and handlers
 * 
 * @example
 * ```tsx
 * const { searchTerm, handleSearch, handleSearchBlur } = useBookSearch({
 *   onSearch: (term) => updateFilters({ search: term }),
 *   debounceMs: 500,
 *   minSearchLength: 3,
 *   initialSearchTerm: filters.search
 * });
 * 
 * <Input 
 *   value={searchTerm}
 *   onChange={(e) => handleSearch(e.target.value)}
 *   onBlur={handleSearchBlur}
 * />
 * ```
 */
export function useBookSearch({
  onSearch,
  debounceMs = 600,
  minSearchLength = 3,
  initialSearchTerm,
}: UseBookSearchParams): UseBookSearchReturn {
  // Initialize with initialSearchTerm from context (which loads from localStorage)
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm || '');
  const [lastSearched, setLastSearched] = useState<string>('');
  
  // Use ref instead of state to avoid memory leaks
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isInitialMount = useRef(true);
  const hasInitializedFromContext = useRef(false);

  /**
   * Validates search term (must be empty or meet minimum length requirement)
   */
  const isValidSearch = useCallback(
    (value: string): boolean => {
      return value.length === 0 || value.length >= minSearchLength;
    },
    [minSearchLength]
  );

  /**
   * Performs the actual search
   */
  const performSearch = useCallback(
    (value: string) => {
      if (!isValidSearch(value)) {
        return;
      }

      // Don't perform a search if the value is already the last searched term
      if (value === lastSearched) {
        return;
      }

      setLastSearched(value);
      onSearch(value);
    },
    [isValidSearch, lastSearched, onSearch]
  );

  /**
   * Handles search input changes with debouncing
   */
  const handleSearch = useCallback(
    (value: string) => {
      // Update the input value immediately for responsiveness
      setSearchTerm(value);

      // Don't proceed with search if term is invalid
      if (!isValidSearch(value)) {
        return;
      }

      // Clear previous timeout if it exists
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout for debounced search
      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, debounceMs);
    },
    [debounceMs, isValidSearch, performSearch]
  );

  /**
   * Handles blur event to immediately trigger search
   */
  const handleSearchBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Don't proceed if search term is invalid
      if (!isValidSearch(value)) {
        return;
      }

      // Clear any pending debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = undefined;
      }

      // Execute search immediately
      performSearch(value);
    },
    [isValidSearch, performSearch]
  );

  // Sync from context ONLY once when initialSearchTerm is first available
  // This handles localStorage restoration without interfering with user typing
  useEffect(() => {
    if (!hasInitializedFromContext.current && initialSearchTerm !== undefined) {
      console.log('[useBookSearch] Initial sync from context:', initialSearchTerm);
      setSearchTerm(initialSearchTerm);
      hasInitializedFromContext.current = true;
      
      // Trigger initial search if term is valid
      if (initialSearchTerm && isValidSearch(initialSearchTerm)) {
        console.log('[useBookSearch] Triggering initial search');
        setLastSearched(initialSearchTerm);
        onSearch(initialSearchTerm);
      }
      isInitialMount.current = false;
    }
  }, [initialSearchTerm, isValidSearch, onSearch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    searchTerm,
    handleSearch,
    handleSearchBlur,
    isValidSearch,
    setSearchTerm,
  };
}
