'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Book as BookIcon } from 'lucide-react';
import { DEFAULT_COVER_SIZES } from '@/types/images';
import type { Book } from '@/types';
import { PreviewCover } from '@/components/books/preview-cover';

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    ),
});

export function PreviewsCollection() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        async function fetchPreviewBooks() {
            try {
                setLoading(true);
                const response = await fetch('/api/books?displayPreviews=1&sortOrder=desc&isVisible=1');
                if (!response.ok) {
                    throw new Error(`Failed to fetch preview books: ${response.status}`);
                }
                const { books } = await response.json();
                setBooks(Array.isArray(books) ? books : []);
            } catch (error) {
                console.error('Error loading preview books:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPreviewBooks();
        setMounted(true);
        return () => setMounted(false);
    }, []);

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
