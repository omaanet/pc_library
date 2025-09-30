import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export interface BookCollectionErrorProps {
  error: Error | null;
  onRetry: () => void;
}

/**
 * Error display component for the book collection with retry functionality.
 * 
 * @param props - Component props
 * @param props.error - Error object to display
 * @param props.onRetry - Handler for retry action
 * 
 * @example
 * ```tsx
 * <BookCollectionError
 *   error={error}
 *   onRetry={retry}
 * />
 * ```
 */
export function BookCollectionError({
  error,
  onRetry,
}: BookCollectionErrorProps) {
  if (!error) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>Failed to load books. Please try again later.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="w-fit"
        >
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
