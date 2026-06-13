'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Headphones } from 'lucide-react';
import { formatAudioLength, cn, isBookEffectivelyNew } from '@/lib/utils';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';
import { DEFAULT_COVER_SIZES } from '@/types/images';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Book } from '@/types';
import { BookAvailabilityBadge } from './book-availability-badge';
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

type ResolvedImageState = {
    url: string;
    status: 'loaded' | 'failed';
};

export function BookGridCard({ book, onSelect, className }: BookGridCardProps) {
    const hasVisibleAudio = isAudioAvailable(book);
    const presentationMode = getBookPresentationMode(book);
    const actionLabel = ACTION_LABELS[presentationMode];
    const isAvailable = presentationMode !== 'unavailable';
    const isNew = isBookEffectivelyNew(book);
    const { width, height } = DEFAULT_COVER_SIZES.grid;
    const isPlaceholder = book.coverImage === IMAGE_CONFIG.placeholder.token;
    const coverUrl = getCoverImageUrl(
        book.coverImage,
        'grid',
        { bookId: isPlaceholder ? book.id : undefined }
    );
    const imageUrl = isPlaceholder ? coverUrl : `${coverUrl}?mode=cover`;
    const fallbackImageUrl = getCoverImageUrl(
        IMAGE_CONFIG.placeholder.token,
        'grid',
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
                    <span className="relative inline-flex max-w-full transition-transform duration-300 group-hover:scale-[var(--book-grid-cover-hover-scale)] motion-reduce:transition-none">
                        {!imageSettled && (
                            <Skeleton className="absolute inset-0" />
                        )}

                        <Image
                            key={activeImageUrl}
                            src={activeImageUrl}
                            alt=""
                            width={width}
                            height={height}
                            className={cn(
                                "h-auto w-auto max-w-full object-contain transition-opacity duration-300 motion-reduce:transition-none",
                                imageStatus === 'loaded' ? "opacity-100" : "opacity-0"
                            )}
                            style={{ maxHeight: height }}
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

                        <BookAvailabilityBadge
                            book={book}
                            className={imageSettled ? 'opacity-100' : 'opacity-0'}
                            palette="gold"
                        />

                        {isNew && (
                            <span className={cn(
                                "absolute left-[var(--book-grid-new-badge-left)] top-[var(--book-grid-new-badge-top)] z-10 rounded",
                                "bg-emerald-600/90 px-2 py-0.5 text-xs font-semibold text-white",
                                "backdrop-blur-sm transition-[opacity,transform] duration-300 group-hover:scale-[var(--book-grid-badge-hover-scale)] motion-reduce:transition-none",
                                imageSettled ? "opacity-100" : "opacity-0"
                            )}>
                                NEW
                            </span>
                        )}
                    </span>
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
