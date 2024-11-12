// src/components/books/book-list-card.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Headphones } from 'lucide-react';
import { formatDate, formatAudioLength, cn } from '@/lib/utils';
import type { Book } from '@/types';
import { Button } from '@/components/ui/button';

interface BookListCardProps {
    book: Book;
    onSelect: (book: Book) => void;
    className?: string;
}

export function BookListCard({ book, onSelect, className }: BookListCardProps) {
    return (
        <div
            className={cn(
                "group flex gap-4 border-b p-4 hover:bg-accent/50 transition-colors",
                className
            )}
        >
            {/* Cover Image */}
            <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-sm">
                <Image
                    src={book.coverImage}
                    alt={`Cover of ${book.title}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                    priority={false}
                />
                {book.hasAudio && (
                    <div className="absolute top-1 right-1 rounded-full bg-background/80 p-1 backdrop-blur-sm">
                        <Headphones className="h-3 w-3" />
                    </div>
                )}
            </div>

            {/* Book Info */}
            <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-semibold tracking-tight">
                            {book.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatDate(book.publishingDate)}</span>
                            {book.hasAudio && book.audioLength && (
                                <span className="flex items-center gap-1">
                                    <Headphones className="h-4 w-4" />
                                    {formatAudioLength(book.audioLength)}
                                </span>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelect(book)}
                    >
                        View Details
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {book.summary}
                </p>
            </div>
        </div>
    );
}