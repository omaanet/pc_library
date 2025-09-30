import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export interface BookCollectionLoadMoreProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

/**
 * Load more button for pagination in the book collection.
 * 
 * @param props - Component props
 * @param props.hasMore - Whether there are more books to load
 * @param props.isLoading - Whether books are currently being loaded
 * @param props.onLoadMore - Handler for load more action
 * 
 * @example
 * ```tsx
 * <BookCollectionLoadMore
 *   hasMore={pagination.total > books.length}
 *   isLoading={isLoadingMore}
 *   onLoadMore={loadMore}
 * />
 * ```
 */
export function BookCollectionLoadMore({
  hasMore,
  isLoading,
  onLoadMore,
}: BookCollectionLoadMoreProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <div className="flex justify-center pt-4">
      <Button
        variant="outline"
        onClick={onLoadMore}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Caricamento...
          </>
        ) : (
          'Carica altro'
        )}
      </Button>
    </div>
  );
}
