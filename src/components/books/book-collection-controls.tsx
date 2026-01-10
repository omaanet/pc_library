import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookWithSign } from '@/components/shared/book-with-sign';

/**
 * Header controls for the book collection displaying the library title and icon.
 * 
 * @example
 * ```tsx
 * <BookCollectionControls />
 * ```
 */
export interface BookCollectionControlsProps {
    onRefresh?: () => void | Promise<void>;
    isRefreshing?: boolean;
}

export function BookCollectionControls({ onRefresh, isRefreshing = false }: BookCollectionControlsProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-4 ms-2 sm:ms-4">
                <BookWithSign className="h-10 w-10 self-center float-anim" />
                <h2 className="text-2xl sm:text-3xl font-medium tracking-normal">
                    Biblioteca
                </h2>
            </div>

            {onRefresh && (
                <div className="flex justify-end sm:justify-start">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void onRefresh()}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={isRefreshing ? 'h-4 w-4 mr-2 animate-spin' : 'h-4 w-4 mr-2'} />
                        Aggiorna
                    </Button>
                </div>
            )}
        </div>
    );
}
