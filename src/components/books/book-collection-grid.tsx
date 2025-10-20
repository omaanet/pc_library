import type { Book } from '@/types';
import type { ViewMode } from '@/types/context';
import { BookGridCard } from './book-grid-card';
import { BookListCard } from './book-list-card';

export interface BookCollectionGridProps {
  books: Book[];
  viewMode: ViewMode;
  onSelectBook: (book: Book | null) => void;
}

/**
 * Renders the book collection in either grid or list view mode.
 * 
 * @param props - Component props
 * @param props.books - Array of books to display
 * @param props.viewMode - Display mode ('grid' or 'list')
 * @param props.onSelectBook - Handler for book selection
 * 
 * @example
 * ```tsx
 * <BookCollectionGrid
 *   books={books}
 *   viewMode="grid"
 *   onSelectBook={selectBook}
 * />
 * ```
 */
export function BookCollectionGrid({
  books,
  viewMode,
  onSelectBook,
}: BookCollectionGridProps) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 w-full">
        {books.map((book) => (
          <BookGridCard
            key={book.id}
            book={book}
            onSelect={onSelectBook}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border bg-card w-100">
      {books.map((book) => (
        <BookListCard
          key={book.id}
          book={book}
          onSelect={onSelectBook}
        />
      ))}
    </div>
  );
}
