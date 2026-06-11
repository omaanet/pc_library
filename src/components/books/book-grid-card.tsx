'use client';

import * as React from 'react';
import Image from 'next/image';
import { Headphones } from 'lucide-react';
import { formatAudioLength, cn, isBookEffectivelyNew } from '@/lib/utils';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';
import { DEFAULT_COVER_SIZES, getImageSizeString } from '@/types/images';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Book } from '@/types';
import { formatBookDomId } from './book-dom-id';
import { getBookPresentationMode, isAudioAvailable } from '@/lib/book-visibility';

interface BookGridCardProps {
    book: Book;
    onSelect: (book: Book) => void;
    className?: string;
}

export function BookGridCard({ book, onSelect, className }: BookGridCardProps) {
    const hasVisibleAudio = isAudioAvailable(book);
    const presentationMode = getBookPresentationMode(book);
    const actionLabel = presentationMode === 'reading-and-audio'
        ? 'Leggi e Ascolta'
        : presentationMode === 'audio-only'
            ? 'Ascolta'
            : 'Leggi';
    // Track image loading state
    const [imageLoaded, setImageLoaded] = React.useState(false);

    const isNew = React.useMemo(() => {
        return isBookEffectivelyNew(book);
    }, [book.isNew, book.publishingDate]);

    // Get image dimensions for this view type
    const { width, height } = DEFAULT_COVER_SIZES.grid;

    // Generate image URL - memoized to prevent unnecessary recalculations
    const imageUrl = React.useMemo(() => {
        const isPlaceholder = book.coverImage === IMAGE_CONFIG.placeholder.token;
        const coverUrl = getCoverImageUrl(
            book.coverImage,
            'grid',
            { bookId: isPlaceholder ? book.id : undefined }
        );

        return isPlaceholder ? coverUrl : `${coverUrl}?mode=cover`;
    }, [book.coverImage, book.id]);

    // Memoize the cover image component to prevent unnecessary re-renders
    const coverImage = React.useMemo(() => (
        <div
            className="flex w-full cursor-pointer select-none items-center justify-center px-2 pb-0 pt-4"
            onClick={() => onSelect(book)}
        >
            <div className="relative inline-flex max-w-full transition-transform duration-300 group-hover:scale-[var(--book-grid-cover-hover-scale)]">
                {/* Loading skeleton */}
                {!imageLoaded && (
                    <Skeleton className="absolute inset-0" />
                )}

                {/* Book cover image */}
                <Image
                    src={imageUrl}
                    alt={`Cover of ${book.title}`}
                    width={width}
                    height={height}
                    className={cn(
                        "h-auto w-auto max-w-full object-contain transition-opacity duration-300",
                        imageLoaded ? "opacity-100" : "opacity-0"
                    )}
                    style={{ maxHeight: height }}
                    sizes={getImageSizeString('grid')}
                    priority={false}
                    loading="lazy"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageLoaded(true)} // Ensure we remove loading state even on error
                    unoptimized
                />

                {/* Audio badge */}
                {hasVisibleAudio && (
                    <div className={cn(
                        "absolute right-[var(--book-grid-audio-badge-right)] top-[var(--book-grid-audio-badge-top)] z-10 rounded-full bg-yellow-600/80 p-1.5",
                        "backdrop-blur-sm transition-[opacity,transform] duration-300 group-hover:scale-[var(--book-grid-badge-hover-scale)]",
                        imageLoaded ? "opacity-100" : "opacity-0"
                    )}>
                        <Headphones className="h-6 w-6" />
                    </div>
                )}

                {isNew && (
                    <div className={cn(
                        "absolute left-[var(--book-grid-new-badge-left)] top-[var(--book-grid-new-badge-top)] z-10 rounded",
                        "bg-emerald-600/90 px-2 py-0.5 text-xs font-semibold text-white",
                        "backdrop-blur-sm transition-[opacity,transform] duration-300 group-hover:scale-[var(--book-grid-badge-hover-scale)]",
                        imageLoaded ? "opacity-100" : "opacity-0"
                    )}>
                        NEW
                    </div>
                )}
            </div>
        </div>
    ), [imageUrl, book.title, hasVisibleAudio, isNew, imageLoaded, width, height, onSelect, book]);

    // Memoize book metadata to prevent unnecessary re-renders
    const bookMetadata = React.useMemo(() => (
        <div className="flex flex-col items-center justify-center text-sm">
            {hasVisibleAudio && book.audioLength ? (
                <div className="flex items-center gap-y-0 gap-x-2 text-muted-foreground">
                    <Headphones className="h-4 w-4" />
                    {formatAudioLength(book.audioLength)}
                </div>
            ) : (
                <>
                    {/* {formatDate(book.publishingDate)} */}
                </>
            )}
        </div>
    ), [hasVisibleAudio, book.audioLength]);

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
                {coverImage}

                <div className="px-4 pt-2 pb-3">

                    <div className="flex flex-col items-center justify-center mb-2 h-[3.25rem]">
                        <h3 className="line-clamp-1 text-center text-lg font-semibold tracking-tight">
                            {book.title}
                        </h3>
                        {bookMetadata}
                    </div>

                    <Button
                        variant="secondary"
                        className="w-full select-none"
                        onClick={() => onSelect(book)}
                        size="lg"
                    >
                        {actionLabel}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
