'use client';

import * as React from 'react';
import Image from 'next/image';
import { Headphones } from 'lucide-react';
import { cn, isBookNew } from '@/lib/utils';
import { SITE_CONFIG } from '@/config/site-config';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';
import { DEFAULT_COVER_SIZES, getImageSizeString } from '@/types/images';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book } from '@/types';

interface BookCoverProps {
    book: Book;
    orientation: 'portrait' | 'landscape';
    className?: string;
}

export function BookCover({ book, orientation, className }: BookCoverProps) {
    // Track image loading state
    const [imageLoaded, setImageLoaded] = React.useState(false);

    const isNew = React.useMemo(() => {
        return isBookNew(book.publishingDate, SITE_CONFIG.BOOK_BADGES.NEW_DAYS);
    }, [book.publishingDate]);

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
            className="relative flex justify-center items-center bg-muted/30 rounded-sm"
            style={{ width, height }}
        >
            {/* Loading skeleton */}
            {!imageLoaded && (
                <Skeleton className="absolute inset-0 rounded-sm" />
            )}

            {/* Book cover image */}
            <img
                src={imageUrl}
                alt={`Cover of ${book.title}`}
                width={width}
                height={height}
                className={cn(
                    "max-w-full max-h-full rounded-sm object-contain transition-opacity duration-200",
                    imageLoaded ? "opacity-100" : "opacity-0"
                )}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
            />

            {/* Audio badge */}
            {book.hasAudio && (
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
    ), [imageUrl, book.title, book.hasAudio, isNew, imageLoaded, width, height]);

    // Title component
    const titleComponent = (
        <div className={cn(
            "text-sm font-medium line-clamp-2",
            orientation === 'landscape' ? "ml-3" : "mt-2 text-center"
        )}>
            {book.title}
        </div>
    );

    return (
        <div
            className={cn(
                orientation === 'portrait'
                    ? "flex flex-col items-center"
                    : "flex flex-row items-center",
                className
            )}
        >
            {coverImage}
            {titleComponent}
        </div>
    );
}
