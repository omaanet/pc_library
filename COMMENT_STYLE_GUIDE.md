# Comment Style Guide

## Overview
This document defines the commenting standards for the codebase to ensure consistency and improve IDE tooling support.

## Comment Types

### 1. JSDoc Comments (`/** */`)

**Use JSDoc for:**
- Functions (exported and internal)
- Classes and class methods
- Interfaces and type definitions
- Exported constants and configuration objects
- React components

**Format:**
```typescript
/**
 * Brief description of the function/component
 * 
 * @param paramName - Description of the parameter
 * @param optionalParam - Description (optional)
 * @returns Description of return value
 * @throws ErrorType - When this error occurs
 * 
 * @example
 * ```typescript
 * const result = myFunction('value');
 * ```
 */
```

**Example:**
```typescript
/**
 * Fetches books from the API with filtering and pagination
 * 
 * @param options - Query options for filtering and pagination
 * @returns Promise resolving to paginated book results
 * @throws ApiError - When the API request fails
 * 
 * @example
 * ```typescript
 * const result = await getAllBooksOptimized({
 *   page: 1,
 *   perPage: 10,
 *   search: 'fantasy'
 * });
 * ```
 */
export async function getAllBooksOptimized(options: BookQueryOptions): Promise<PaginatedResult<Book>> {
  // Implementation
}
```

### 2. Regular Comments (`//`)

**Use regular comments for:**
- Inline explanations within functions
- TODO and FIXME markers
- Code block explanations
- Temporary debugging notes
- Complex algorithm explanations

**Format:**
```typescript
// Brief explanation of what the next line(s) do
const result = complexOperation();

// TODO: Refactor this to use the new API
// FIXME: Handle edge case when value is null
```

**Example:**
```typescript
export function processData(data: Data[]): ProcessedData[] {
  // Filter out invalid entries
  const validData = data.filter(item => item.isValid);
  
  // TODO: Add caching to improve performance
  const processed = validData.map(item => {
    // Convert timestamp to date object
    const date = new Date(item.timestamp);
    
    return {
      ...item,
      date,
      // FIXME: This calculation doesn't account for timezone
      dayOfWeek: date.getDay()
    };
  });
  
  return processed;
}
```

### 3. Multi-line Regular Comments (`/* */`)

**Use sparingly for:**
- Temporarily commenting out large code blocks during development
- License headers (if required)

**Note:** Prefer JSDoc (`/** */`) for documentation and single-line (`//`) for explanations.

## Best Practices

### DO:
- ✅ Use JSDoc for all exported functions, components, and types
- ✅ Include `@param` tags for all parameters
- ✅ Include `@returns` tag for non-void functions
- ✅ Add `@example` for complex APIs
- ✅ Use inline comments to explain "why", not "what"
- ✅ Keep comments up-to-date with code changes
- ✅ Use TODO/FIXME markers with context

### DON'T:
- ❌ Mix JSDoc and regular comments for the same purpose
- ❌ Leave commented-out code in production
- ❌ Write obvious comments (e.g., `// increment i` for `i++`)
- ❌ Use comments to explain bad code (refactor instead)
- ❌ Forget to update comments when code changes

## React Component Documentation

### Functional Components:
```typescript
/**
 * Displays a paginated list of books with filtering options
 * 
 * @param props - Component props
 * @param props.displayPreviews - Filter for preview books (0: exclude, 1: only previews, -1: all)
 * @param props.initialPage - Starting page number
 * @returns Book collection component
 */
export function BookCollection({ displayPreviews = 0, initialPage = 1 }: BookCollectionProps) {
  // Component implementation
}
```

### Props Interfaces:
```typescript
/**
 * Props for the BookCollection component
 */
export interface BookCollectionProps {
  /** Filter for preview books: 0 = exclude, 1 = only previews, -1 = all */
  displayPreviews?: number;
  /** Starting page number (1-indexed) */
  initialPage?: number;
  /** Callback when a book is selected */
  onBookSelect?: (book: Book) => void;
}
```

## Type Documentation

### Interfaces:
```typescript
/**
 * Represents a book in the library
 */
export interface Book {
  /** Unique identifier */
  id: string;
  /** Book title */
  title: string;
  /** URL to cover image */
  coverImage: string;
  /** Publication date in ISO format */
  publishingDate: string;
  /** Whether the book has audio narration */
  hasAudio: boolean;
}
```

### Type Aliases:
```typescript
/**
 * Sort order for queries
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Filter options for book queries
 */
export type BookFilters = {
  /** Search term for title/content */
  search?: string;
  /** Filter by audio availability */
  hasAudio?: boolean;
};
```

## API Route Documentation

```typescript
/**
 * GET /api/books
 * Fetches books with filtering, sorting, and pagination
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - perPage: Items per page (default: 10, max: 100)
 * - search: Search term
 * - hasAudio: Filter by audio availability
 * - sortBy: Sort column
 * - sortOrder: Sort direction (asc/desc)
 * 
 * @returns JSON response with books array and pagination metadata
 * @throws 400 - Invalid query parameters
 * @throws 500 - Database error
 */
export async function GET(request: Request) {
  // Implementation
}
```

## Enforcement

### IDE Configuration
- Enable JSDoc validation in TypeScript
- Use ESLint rules for comment formatting
- Configure editor to show JSDoc hints on hover

### Code Review Checklist
- [ ] All exported functions have JSDoc comments
- [ ] All parameters are documented with `@param`
- [ ] Return values are documented with `@returns`
- [ ] Complex logic has inline explanations
- [ ] No commented-out code remains
- [ ] Comments are clear and add value

## Migration Strategy

When updating existing code:
1. Start with public APIs (exported functions, components)
2. Add JSDoc to interfaces and types
3. Update inline comments for clarity
4. Remove obsolete comments
5. Verify IDE shows proper documentation hints

## Tools

- **TypeScript**: Validates JSDoc syntax
- **ESLint**: Enforces comment style rules
- **IDE**: Shows JSDoc hints on hover
- **Documentation generators**: Can extract JSDoc for API docs

---

**Last Updated:** 2025-09-30
**Status:** Active
