'use client';

import { Headphones } from 'lucide-react';
import { formatAudioLength, cn } from '@/lib/utils';
import { DEFAULT_COVER_SIZES } from '@/types/images';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Book } from '@/types';
import { BookCoverPresentation } from './book-cover-presentation';
import { formatBookDomId } from './book-dom-id';
import {
    getBookPresentationMode,
    isAudioAvailable,
    type BookPresentationMode,
} from '@/lib/book-visibility';

interface BookGridCardProps {
    book: Book;
    onSelect: (book: Book) => void;
    className?: string;
}

const ACTION_LABELS: Record<BookPresentationMode, string> = {
    'reading-only': 'Leggi',
    'audio-only': 'Ascolta',
    'reading-and-audio': 'Leggi o Ascolta',
    unavailable: 'Non disponibile',
};

export function BookGridCard({ book, onSelect, className }: BookGridCardProps) {
    const hasVisibleAudio = isAudioAvailable(book);
    const presentationMode = getBookPresentationMode(book);
    const actionLabel = ACTION_LABELS[presentationMode];
    const isAvailable = presentationMode !== 'unavailable';
    const { height } = DEFAULT_COVER_SIZES.grid;

    return (
        <Card
            id={formatBookDomId(book.id)}
            data-book-card
            className={cn(
                "group transition-colors hover:border-primary",
                className
            )}
        >
            <CardContent className="p-0">
                <button
                    type="button"
                    className={cn(
                        "flex w-full appearance-none items-center justify-center border-0 bg-transparent px-2 pb-0 pt-4",
                        "select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        isAvailable ? "cursor-pointer" : "cursor-not-allowed"
                    )}
                    onClick={() => onSelect(book)}
                    disabled={!isAvailable}
                    aria-label={`${actionLabel}: ${book.title}`}
                >
                    <BookCoverPresentation
                        book={book}
                        size="grid"
                        alt=""
                        className="inline-flex max-w-full transition-transform duration-300 group-hover:scale-[var(--book-grid-cover-hover-scale)] motion-reduce:transition-none"
                        imageClassName="h-auto w-auto max-w-full"
                        imageStyle={{ maxHeight: height }}
                    />
                </button>

                <div className="px-4 pt-2 pb-3">
                    <div className="flex flex-col items-center justify-center mb-2 h-[3.25rem]">
                        <h3 className="line-clamp-1 text-center text-lg font-semibold tracking-tight">
                            {book.title}
                        </h3>
                        <div className="flex flex-col items-center justify-center text-sm">
                            {hasVisibleAudio && book.audioLength ? (
                                <div className="flex items-center gap-y-0 gap-x-2 text-muted-foreground">
                                    <Headphones aria-hidden="true" className="h-4 w-4" />
                                    {formatAudioLength(book.audioLength)}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <Button
                        variant="secondary"
                        className="w-full select-none"
                        onClick={() => onSelect(book)}
                        size="lg"
                        disabled={!isAvailable}
                    >
                        {actionLabel}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
