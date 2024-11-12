// src/components/books/book-shelf.tsx
'use client';

import * as React from 'react';
import type { Book } from '@/types';
import { BookGridCard } from './book-grid-card';
import { BookListCard } from './book-list-card';
import { ViewSwitcher } from '@/components/shared/view-switcher';

interface BookShelfProps {
    books: Book[];
    onSelectBook: (book: Book) => void;
    className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BookShelf({ books, onSelectBook, className }: BookShelfProps) {
    const [view, setView] = React.useState<'grid' | 'list'>('grid');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Library Collection
                </h2>
                <ViewSwitcher view={view} onViewChange={setView} />
            </div>

            {view === 'grid' ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {books.map((book) => (
                        <BookGridCard
                            key={book.id}
                            book={book}
                            onSelect={onSelectBook}
                        />
                    ))}
                </div>
            ) : (
                <div className="divide-y">
                    {books.map((book) => (
                        <BookListCard
                            key={book.id}
                            book={book}
                            onSelect={onSelectBook}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}