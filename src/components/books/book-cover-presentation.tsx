'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';
import { cn, isBookEffectivelyNew } from '@/lib/utils';
import type { Book } from '@/types';
import { DEFAULT_COVER_SIZES } from '@/types/images';
import { BookAvailabilityBadge } from './book-availability-badge';

type BookCoverPresentationSize = 'grid' | 'detail' | 'dialog' | 'zoom';

interface BookCoverPresentationProps {
    book: Book;
    size: BookCoverPresentationSize;
    alt: string;
    className?: string;
    imageClassName?: string;
    imageStyle?: CSSProperties;
    skeletonClassName?: string;
    sizes?: string;
    showBadges?: boolean;
    loadingFallback?: ReactNode;
}

type ResolvedImageState = {
    url: string;
    status: 'loaded' | 'failed';
};

export function BookCoverPresentation({
    book,
    size,
    alt,
    className,
    imageClassName,
    imageStyle,
    skeletonClassName,
    sizes,
    showBadges = true,
    loadingFallback,
}: BookCoverPresentationProps) {
    const { width, height } = DEFAULT_COVER_SIZES[size];
    const isPlaceholder = book.coverImage === IMAGE_CONFIG.placeholder.token;
    const coverUrl = getCoverImageUrl(
        book.coverImage,
        size,
        { bookId: isPlaceholder ? book.id : undefined }
    );
    const imageUrl = isPlaceholder ? coverUrl : `${coverUrl}?mode=cover`;
    const fallbackImageUrl = getCoverImageUrl(
        IMAGE_CONFIG.placeholder.token,
        size,
        { bookId: book.id }
    );
    const [fallbackForUrl, setFallbackForUrl] = useState<string | null>(null);
    const [resolvedImage, setResolvedImage] = useState<ResolvedImageState | null>(null);
    const activeImageUrl = fallbackForUrl === imageUrl ? fallbackImageUrl : imageUrl;
    const imageStatus = resolvedImage?.url === activeImageUrl
        ? resolvedImage.status
        : 'loading';
    const imageSettled = imageStatus !== 'loading';
    const imageFailed = imageStatus === 'failed';

    const handleImageError = () => {
        if (!isPlaceholder && activeImageUrl === imageUrl) {
            setFallbackForUrl(imageUrl);
            return;
        }

        setResolvedImage({ url: activeImageUrl, status: 'failed' });
    };

    return (
        <span className={cn('relative', className)}>
            {!imageSettled && (
                <Skeleton className={cn('absolute inset-0', skeletonClassName)}>
                    {loadingFallback && (
                        <span className="absolute inset-0 flex items-center justify-center">
                            {loadingFallback}
                        </span>
                    )}
                </Skeleton>
            )}

            <Image
                key={activeImageUrl}
                src={activeImageUrl}
                alt={alt}
                width={width}
                height={height}
                className={cn(
                    'object-contain transition-opacity duration-300 motion-reduce:transition-none',
                    imageClassName,
                    imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
                )}
                style={imageStyle}
                sizes={sizes}
                onLoad={() => setResolvedImage({
                    url: activeImageUrl,
                    status: 'loaded',
                })}
                onError={handleImageError}
            />

            {imageFailed && (
                <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center bg-muted px-4 text-center text-sm text-muted-foreground"
                >
                    Copertina non disponibile
                </span>
            )}

            {showBadges && (
                <>
                    <BookAvailabilityBadge
                        book={book}
                        className={imageSettled ? 'opacity-100' : 'opacity-0'}
                        iconSize={19}
                        palette="gold"
                    />

                    {isBookEffectivelyNew(book) && (
                        <span className={cn(
                            'absolute left-[var(--book-grid-new-badge-left)] top-[var(--book-grid-new-badge-top)] z-10 rounded',
                            'bg-emerald-600/90 px-2 py-0.5 text-xs font-semibold text-white',
                            'backdrop-blur-sm transition-[opacity,transform] duration-300 group-hover:scale-[var(--book-grid-badge-hover-scale)] motion-reduce:transition-none',
                            imageSettled ? 'opacity-100' : 'opacity-0'
                        )}>
                            NEW
                        </span>
                    )}
                </>
            )}
        </span>
    );
}
