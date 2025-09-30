'use client';

import { usePreviewBooks } from '@/hooks/use-preview-books';
import { Book as BookIcon, RefreshCw } from 'lucide-react';
import type { Book } from '@/types';
import { PreviewCover } from '@/components/books/preview-cover';
import { Button } from '@/components/ui/button';

export function PreviewsCollection() {
    const { books, loading, mounted, error, retry } = usePreviewBooks();

    return (
        <div className="rounded-xl border bg-card p-6">
            <div className="flex flex-row items-center justify-center mb-8">
                <BookIcon className="h-8 w-8 -mt-1 mx-2" />
                <div className="text-xl font-semibold mx-2 text-center">Racconti In Anteprima</div>
            </div>

            <div id="previews-collection-list">
                <div className="container-fluid text-center flex flex-wrap gap-4 justify-center items-start">

                    {loading ? (
                        <div className="py-4 text-muted-foreground">Caricamento anteprima libri...</div>
                    ) : error ? (
                        <div className="py-4 space-y-4">
                            <div className="text-red-500">Errore nel caricamento: {error}</div>
                            <Button
                                onClick={retry}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Riprova
                            </Button>
                        </div>
                    ) : !Array.isArray(books) || books.length === 0 ? (
                        <div className="py-4 text-muted-foreground">Al momento non sono disponibili anteprime dei libri.</div>
                    ) : (
                        books.map((book, index) => (
                            <PreviewCover key={`${book.id}-${index}`} mounted={mounted} book={book} index={index} itemsVerticalAlign="items-start" />
                        ))
                    )}

                </div>
            </div>
        </div>
    );
}
