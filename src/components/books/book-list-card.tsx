'use client';

import * as React from 'react';
import Image from 'next/image';
import { Headphones } from 'lucide-react';
import { formatDate, formatAudioLength, cn, isBookEffectivelyNew } from '@/lib/utils';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';
import { DEFAULT_COVER_SIZES, getImageSizeString } from '@/types/images';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book } from '@/types';
import { formatBookDomId } from './book-dom-id';
import { getBookPresentationMode, isAudioAvailable } from '@/lib/book-visibility';

interface BookListCardProps {
    book: Book;
    onSelect: (book: Book) => void;
    className?: string;
}

export function BookListCard({ book, onSelect, className }: BookListCardProps) {
    const hasVisibleAudio = isAudioAvailable(book);
    const presentationMode = getBookPresentationMode(book);
    const actionLabel = presentationMode === 'reading-and-audio'
        ? 'Leggi o Ascolta'
        : presentationMode === 'audio-only'
            ? 'Ascolta'
            : 'Leggi';
    // Track image loading state
    const [imageLoaded, setImageLoaded] = React.useState(false);

    const isNew = React.useMemo(() => {
        return isBookEffectivelyNew(book);
    }, [book.isNew, book.publishingDate]);

    // Get image dimensions for list view
    const { width, height } = DEFAULT_COVER_SIZES.list;

    // Generate image URL - memoized to prevent unnecessary recalculations
    const imageUrl = React.useMemo(() => {
        const isPlaceholder = book.coverImage === IMAGE_CONFIG.placeholder.token;
        return getCoverImageUrl(
            book.coverImage,
            'list',
            { bookId: isPlaceholder ? book.id : undefined }
        );
    }, [book.coverImage, book.id]);

    // Memoize the cover image component to prevent unnecessary re-renders
    const coverImage = React.useMemo(() => (
        <div
            className="relative flex-shrink-0 flex justify-center items-center bg-muted/30 rounded-sm cursor-pointer"
            style={{ width, height }}
            onClick={() => onSelect(book)}
        >
            {/* Loading skeleton */}
            {!imageLoaded && (
                <Skeleton className="absolute inset-0 rounded-sm" />
            )}

            {/* Book cover image */}
            <Image
                src={imageUrl}
                alt={`Cover of ${book.title}`}
                width={width}
                height={height}
                className={cn(
                    "max-w-full max-h-full rounded-sm object-contain transition-opacity duration-200",
                    imageLoaded ? "opacity-100" : "opacity-0"
                )}
                sizes={getImageSizeString('list')}
                quality={75}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
                unoptimized
            />

            {/* Audio badge */}
            {hasVisibleAudio && (
                <div className={cn(
                    "absolute top-1 right-1 rounded-full bg-background/80 p-1",
                    "backdrop-blur-sm transition-opacity duration-200",
                    imageLoaded ? "opacity-100" : "opacity-0"
                )}>
                    <Headphones className="h-5 w-5" />
                </div>
            )}

            {/* NEW badge */}
            {isNew && (
                <div className={cn(
                    "absolute top-1 left-1 rounded bg-emerald-600/90 px-2 py-0.5 text-xs font-semibold text-white",
                    "backdrop-blur-sm transition-opacity duration-200",
                    imageLoaded ? "opacity-100" : "opacity-0"
                )}>
                    NEW
                </div>
            )}
        </div>
    ), [imageUrl, book.title, hasVisibleAudio, isNew, imageLoaded, width, height, onSelect, book]);

    // Memoize metadata to prevent unnecessary re-renders
    const metadata = React.useMemo(() => (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{formatDate(book.publishingDate)}</span>
            {hasVisibleAudio && book.audioLength && (
                <span className="flex items-center gap-1">
                    <Headphones className="h-4 w-4" />
                    {formatAudioLength(book.audioLength)}
                </span>
            )}
        </div>
    ), [book.publishingDate, hasVisibleAudio, book.audioLength]);

    // Memoize book info to prevent unnecessary re-renders
    const bookInfo = React.useMemo(() => (
        <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="font-semibold tracking-tight">
                        {book.title}
                    </h3>
                    {metadata}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelect(book)}
                >
                    {actionLabel}
                </Button>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
                {book.summary}
            </p>

            {/* Additional Book Info */}
            {(book.rating || book.readingProgress) && (
                <div className="flex gap-4 mt-1 text-sm">
                    {book.rating && (
                        <span className="text-muted-foreground">
                            Valutazione: {book.rating}/5
                        </span>
                    )}
                    {book.readingProgress && (
                        <span className="text-muted-foreground">
                            Avanzamento: {book.readingProgress}%
                        </span>
                    )}
                </div>
            )}
        </div>
    ), [book, metadata, onSelect]);

    return (
        <div
            id={formatBookDomId(book.id)}
            data-book-card
            className={cn(
                "group flex gap-4 border-b p-4 hover:bg-accent/50 transition-colors",
                className
            )}
        >
            {coverImage}
            {bookInfo}
        </div>
    );
}
