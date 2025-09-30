# API Standards and Error Handling

## Table of Contents
- [Error Response Format](#error-response-format)
- [HTTP Status Codes](#http-status-codes)
- [Usage Examples](#usage-examples)
- [Books API Sorting](#books-api-sorting)
- [Security Headers](#security-headers)

## Error Response Format

All API errors follow this standardized format:

```typescript
{
  error: string;
  details?: string | Record<string, any>;
  statusCode?: number;
}
```

## HTTP Status Codes

- 200 OK - Successful GET
- 201 CREATED - Successful POST
- 204 NO_CONTENT - Successful DELETE
- 400 BAD_REQUEST - Invalid input
- 401 UNAUTHORIZED - Authentication required
- 403 FORBIDDEN - Access denied
- 404 NOT_FOUND - Resource not found
- 409 CONFLICT - Resource conflict
- 500 INTERNAL_SERVER_ERROR - Server error

## Usage Examples

### Import the Error Handler

```typescript
import { handleApiError, ApiError, HttpStatus } from '@/lib/api-error-handler';
```

### Throwing Errors

```typescript
// Simple error
throw new ApiError(HttpStatus.NOT_FOUND, 'Book not found');

// Error with details
throw new ApiError(
  HttpStatus.BAD_REQUEST,
  'Validation failed',
  { title: 'Title is required' }
);
```

### Handling Errors in Catch Block

```typescript
try {
  // API logic
} catch (error) {
  return handleApiError(error, 'Failed to fetch books', HttpStatus.INTERNAL_SERVER_ERROR);
}
```

## Implementation Guidelines

1. Always wrap route handlers in try-catch blocks
2. Use ApiError for known error conditions
3. Use handleApiError in catch blocks for consistent formatting
4. Preserve localized error messages (e.g., Italian for auth routes)
5. Include meaningful error details for validation errors

## Client-Side Data Fetching Best Practices

### Use Service Layer for API Calls

Always use the centralized `bookApiService` for API calls instead of direct fetch:

```typescript
// ❌ Bad: Direct fetch in component/hook
const response = await fetch('/api/books?displayPreviews=1');

// ✅ Good: Use service layer
import { bookApiService } from '@/lib/services/book-api-service';
const response = await bookApiService.fetchPreviewBooks({ sortOrder: 'desc' });
```

### Implement Error Boundaries

Wrap data-fetching components with error boundaries for graceful error handling:

```typescript
import { BookErrorBoundary } from '@/components/books/book-error-boundary';

<BookErrorBoundary>
  <PreviewsCollection />
</BookErrorBoundary>
```

### Add Cleanup with AbortController

Always implement proper cleanup in hooks to prevent memory leaks:

```typescript
useEffect(() => {
  let isMounted = true;
  const abortController = new AbortController();

  async function fetchData() {
    try {
      const data = await apiCall();
      if (isMounted) {
        setData(data);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore abort errors
      }
      if (isMounted) {
        setError(error);
      }
    }
  }

  fetchData();

  return () => {
    isMounted = false;
    abortController.abort();
  };
}, []);
```

### Provide Retry Mechanisms

Include retry functionality for failed requests:

```typescript
const [retryCount, setRetryCount] = useState(0);

const retry = () => {
  setRetryCount(prev => prev + 1);
};

useEffect(() => {
  // Fetch data
}, [retryCount]);

// In UI
<Button onClick={retry}>Retry</Button>
```

## Books API Sorting

### Default Sort Configuration

The `/api/books` endpoint uses a configurable default sort order defined in `SITE_CONFIG.DEFAULT_SORT`. This allows changing the default sorting behavior without modifying code.

**Current Default Sort:**
1. Books with audio first (`has_audio ASC`)
2. Then by display order (`display_order ASC`)
3. Then newest books first (`publishing_date DESC NULLS LAST`)

### Sort Parameters

**Query Parameters:**
- `sortBy` (optional): Column to sort by. If not provided, uses `SITE_CONFIG.DEFAULT_SORT`
- `sortOrder` (optional): Sort direction, either `asc` or `desc` (default: `desc`)

**Available Sort Columns:**
- `id` - Book ID
- `title` - Book title
- `publishing_date` - Publishing date (nullable, uses NULLS LAST)
- `summary` - Book summary
- `has_audio` - Audio availability (0 or 1)
- `audio_length` - Audio duration in seconds
- `extract` - Book extract/preview text
- `rating` - Book rating (nullable, uses NULLS LAST)
- `is_preview` - Preview status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `display_order` - Display order
- `pages_count` - Number of pages

### Examples

```bash
# Use default sort (from SITE_CONFIG.DEFAULT_SORT)
GET /api/books?perPage=10

# Sort by title ascending
GET /api/books?sortBy=title&sortOrder=asc

# Sort by publishing date descending (newest first)
GET /api/books?sortBy=publishing_date&sortOrder=desc

# Sort by rating descending (highest rated first)
GET /api/books?sortBy=rating&sortOrder=desc

# Invalid sortBy falls back to default sort
GET /api/books?sortBy=invalid_column&sortOrder=desc
```

### Changing Default Sort

To change the default sort order, modify `SITE_CONFIG.DEFAULT_SORT` in `src/config/site-config.ts`:

```typescript
// Example: Prioritize newest books first
DEFAULT_SORT: [
  ['publishing_date', 'DESC'],
  ['has_audio', 'ASC'],
  ['display_order', 'ASC']
] as const,
```

## Security Headers

### Cover Images (`/api/covers/:path*`)

All cover image responses include the following security headers (configured in `next.config.ts`):

- **Content-Security-Policy**: `default-src 'none'; img-src 'self'`
  - Restricts resource loading to images from same origin only
- **X-Content-Type-Options**: `nosniff`
  - Prevents MIME type sniffing
- **X-Frame-Options**: `DENY`
  - Prevents page from being displayed in frames/iframes
- **Referrer-Policy**: `strict-origin-when-cross-origin`
  - Controls referrer information sent with requests
- **Content-Disposition**: `inline`
  - Ensures images display in browser rather than downloading

### EPUB Files (`/epub/:path*.epub`)

EPUB file responses have different security requirements and include additional headers for proper file handling.

### Header Configuration Location

All security headers are centralized in `next.config.ts` under the `headers()` function. The middleware focuses solely on request validation (dimensions, path security checks) and does not apply headers.
