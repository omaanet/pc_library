import { ArrowDown, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookWithSign } from '@/components/shared/book-with-sign';
import { QuillStage } from '@/components/mascots/quill-stage';
import { usePreviewBooks } from '@/hooks/use-preview-books';

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
    const { previews } = usePreviewBooks();

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-4 sm:flex sm:gap-4 sm:justify-between">
            <div className="ms-1 flex min-w-0 shrink-0 items-center gap-2 sm:ms-4 sm:gap-4">
                <BookWithSign className="h-8 w-8 shrink-0 float-anim sm:h-10 sm:w-10" />
                <h2 id="library-title" tabIndex={-1} className="scroll-mt-24 text-xl min-[375px]:text-2xl sm:text-3xl font-medium tracking-normal outline-none">
                    Biblioteca
                </h2>
            </div>

            {previews.length > 0 && (
                <a
                    href="#previews-collection"
                    className="group order-last col-span-2 flex min-w-0 items-center gap-2.5 rounded-lg border border-sky-200/70 bg-sky-50/70 px-3 py-2 text-sm font-medium leading-relaxed text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-sky-800/60 dark:bg-sky-950/30 dark:text-sky-200 dark:hover:border-sky-700 dark:hover:bg-sky-900/40 sm:order-none motion-reduce:transition-none"
                >
                    <Sparkles className="preview-sparkles h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                    <span>Sono disponibili nuove anteprime dei prossimi libri in uscita.</span>
                    <ArrowDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
            )}

            {/* Free-roaming Quill mascot — walks in after 3s, inspects a book */}
            {/* <QuillStage
                trigger={{ type: 'load', delay: 1000 }}
                choreography="book-inspect"
                frequency="always"
                id="library-book-inspect"
            /> */}

            <QuillStage
                trigger={{ type: 'load', delay: 1000 }}
                choreography="write-and-leave"
                options={{ entrySide: 'right', exitSide: 'left' }}
                frequency="always"
                id="library-write-and-leave"
                targetId="@#book-1760914128273"
            />

            {onRefresh && (
                <div className="flex shrink-0 justify-end sm:justify-start">
                    <Button
                        type="button"
                        variant="outline"
                        className="px-3 sm:px-4"
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
