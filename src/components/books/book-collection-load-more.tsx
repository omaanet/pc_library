import { Button } from '@/components/ui/button';
import { ChevronDown, Loader2 } from 'lucide-react';

export interface BookCollectionLoadMoreProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  shownCount: number;
  totalCount: number;
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
  shownCount,
  totalCount,
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
        className="h-auto py-3"
      >
        {isLoading ? (
          <div className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Caricamento...
          </div>
        ) : (
          <div className="flex flex-col items-center leading-tight">
            <div className="text-sm font-medium">
              {shownCount} di {totalCount}
            </div>
            <ChevronDown className="h-5 w-5" />
          </div>
        )}
      </Button>
    </div>
  );
}
