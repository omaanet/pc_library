# API Standards and Error Handling

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
