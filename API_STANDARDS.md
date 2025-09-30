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
