import { BookOpen } from 'lucide-react';

/**
 * Header controls for the book collection displaying the library title and icon.
 * 
 * @example
 * ```tsx
 * <BookCollectionControls />
 * ```
 */
export function BookCollectionControls() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-baseline gap-4">
        <BookOpen className="h-8 w-8 self-center" />
        <h2 className="text-2xl sm:text-3xl font-medium tracking-normal">
          Biblioteca
        </h2>
      </div>
    </div>
  );
}
