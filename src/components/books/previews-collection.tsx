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
            <div className="flex flex-row items-center justify-center mb-4 sm:mb-8">
                {/* <BookIcon className="h-8 w-8 -mt-1 mx-2" /> */}
                <svg width="48" height="48" viewBox="0 0 25.95 24" fill="none" stroke="currentColor" className="h-11 w-11 -mt-1 mx-2 float-anim">
                    <g transform="translate(2.5 0)" strokeWidth="1" shapeRendering="geometricPrecision" vectorEffect="non-scaling-stroke">
                        <path d="M2 6s4-3 9-3 9 3 9 3v14s-4-3-9-3-9 3-9 3V6z" />
                        <path d="M11 3v14" />
                        {/* Sparkles */}
                        <g strokeWidth="0">
                            <circle cx="22" cy="4" r="1.25" fill="var(--Sparkles-1)" className="opacity-8">
                                <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="-1.25" cy="10" r="1.25" fill="var(--Sparkles-2)" className="opacity-8">
                                <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
                            </circle>
                        </g>
                    </g>
                </svg>
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
                        <div className="p-0 text-muted-foreground">Al momento non sono disponibili anteprime dei libri.</div>
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
