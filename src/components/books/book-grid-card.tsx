'use client';

import * as React from 'react';
import Image from 'next/image';
import { Headphones } from 'lucide-react';
import { formatDate, formatAudioLength, cn } from '@/lib/utils';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';
import { DEFAULT_COVER_SIZES, getImageSizeString } from '@/types/images';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Book } from '@/types';

interface BookGridCardProps {
    book: Book;
    onSelect: (book: Book) => void;
    className?: string;
}

export function BookGridCard({ book, onSelect, className }: BookGridCardProps) {
    // Track image loading state
    const [imageLoaded, setImageLoaded] = React.useState(false);

    // Get image dimensions for this view type
    const { width, height } = DEFAULT_COVER_SIZES.grid;

    // Generate image URL - memoized to prevent unnecessary recalculations
    const imageUrl = React.useMemo(() => {
        const isPlaceholder = book.coverImage === IMAGE_CONFIG.placeholder.token;
        return getCoverImageUrl(
            book.coverImage,
            'grid',
            { bookId: isPlaceholder ? book.id : undefined }
        );
    }, [book.coverImage, book.id]);

    // Memoize the cover image component to prevent unnecessary re-renders
    const coverImage = React.useMemo(() => (
        <div
            className="relative w-full h-auto flex justify-center items-center cursor-pointer"
            style={{ minHeight: height }}
            onClick={() => onSelect(book)}
        >
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
                    "max-w-full max-h-full object-contain transition-scale duration-300",
                    imageLoaded ? "opacity-100" : "opacity-0",
                    "group-hover:scale-105"
                )}
                sizes={getImageSizeString('grid')}
                priority={false}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)} // Ensure we remove loading state even on error
                unoptimized
            />

            {/* Audio badge */}
            {book.hasAudio && (
                <div className={cn(
                    "absolute top-2 right-2 rounded-full bg-yellow-600/80 p-1.5",
                    "backdrop-blur-sm transition-opacity duration-200",
                    imageLoaded ? "opacity-100" : "opacity-0"
                )}>
                    <Headphones className="h-6 w-6" />
                </div>
            )}
        </div>
    ), [imageUrl, book.title, book.hasAudio, imageLoaded, width, height, onSelect, book]);

    // Memoize book metadata to prevent unnecessary re-renders
    const bookMetadata = React.useMemo(() => (
        <div className="flex flex-col items-center justify-center text-sm">
            {book.hasAudio && book.audioLength ? (
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
    ), [/*book.publishingDate,*/ book.hasAudio, book.audioLength]);

    return (
        <Card
            className={cn(
                "group overflow-hidden transition-colors hover:border-primary",
                className
            )}
        >
            <CardContent className="p-0">
                {coverImage}

                <div className="px-4 py-0">

                    <div className="flex flex-col items-center justify-center mb-2 h-[3.25rem]">
                        <h3 className="line-clamp-1 text-center text-lg font-semibold tracking-tight">
                            {book.title}
                        </h3>
                        {bookMetadata}
                    </div>

                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => onSelect(book)}
                    >
                        {book.hasAudio ? 'Ascolta' : 'Leggi'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}