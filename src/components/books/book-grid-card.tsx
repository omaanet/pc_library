// src/components/books/book-grid-card.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Headphones } from 'lucide-react';
import { formatDate, formatAudioLength, cn } from '@/lib/utils';
import type { Book } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BookGridCardProps {
    book: Book;
    onSelect: (book: Book) => void;
    className?: string;
}

export function BookGridCard({ book, onSelect, className }: BookGridCardProps) {
    // Memoize the image to prevent unnecessary re-renders
    const coverImage = React.useMemo(() => (
        <div className="relative aspect-[3/4] overflow-hidden">
            <Image
                src={book.coverImage}
                alt={`Cover of ${book.title}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, 50vw"
                loading="lazy"
            />
            {book.hasAudio && (
                <div className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm">
                    <Headphones className="h-4 w-4" />
                </div>
            )}
        </div>
    ), [book.coverImage, book.title, book.hasAudio]);

    return (
        <Card
            className={cn(
                "group overflow-hidden transition-colors hover:border-primary",
                className
            )}
        >
            <CardContent className="p-0">
                {coverImage}

                {/* Book Info */}
                <div className="space-y-2 p-4">
                    <h3 className="line-clamp-1 text-lg font-semibold tracking-tight">
                        {book.title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {book.summary}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {formatDate(book.publishingDate)}
                        </span>
                        {book.hasAudio && book.audioLength && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <Headphones className="h-4 w-4" />
                                {formatAudioLength(book.audioLength)}
                            </span>
                        )}
                    </div>
                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => onSelect(book)}
                    >
                        View Details
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}