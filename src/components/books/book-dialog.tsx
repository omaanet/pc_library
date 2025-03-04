'use client';

import * as React from 'react';
import Image from 'next/image';
import { Headphones, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatAudioLength, cn } from '@/lib/utils';
import { DEFAULT_COVER_SIZES } from '@/types/images';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';
import type { Book } from '@/types';

interface BookDialogProps {
    book: Book | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isAuthenticated?: boolean;
    onLoginClick?: () => void;
}

export function BookDialog({
    book,
    open,
    onOpenChange,
    isAuthenticated = false,
    onLoginClick,
}: BookDialogProps) {
    const [imageLoaded, setImageLoaded] = React.useState(false);

    // Reset image loaded state when dialog opens/closes or book changes
    React.useEffect(() => {
        setImageLoaded(false);
    }, [book, open]);

    // Memoize cover image to prevent unnecessary re-renders
    const coverImage = React.useMemo(() => {
        if (!book?.coverImage) return null;

        const { width, height } = DEFAULT_COVER_SIZES.detail;
        const aspectRatio = width / height;
        const isPlaceholder = book.coverImage === IMAGE_CONFIG.placeholder.token;
        const imageUrl = getCoverImageUrl(
            book.coverImage,
            'detail',
            { bookId: isPlaceholder ? book.id : undefined }
        );

        return (
            <div className="relative w-full md:w-1/3 shrink-0">
                <div
                    className="relative w-full overflow-hidden rounded-lg"
                    style={{
                        maxWidth: width,
                        aspectRatio: `${aspectRatio}`,
                    }}
                >
                    {/* Background blur effect while loading */}
                    {!imageLoaded && book.coverImage !== IMAGE_CONFIG.placeholder.token && (
                        <Image
                            src={getCoverImageUrl(
                                book.coverImage,
                                'grid',
                                { bookId: isPlaceholder ? book.id : undefined }
                            )}
                            alt=""
                            fill
                            className="absolute inset-0 object-cover blur-lg scale-110"
                            priority={false}
                            quality={20}
                        />
                    )}

                    {/* Main image container */}
                    <div className="relative w-full h-full">
                        <Image
                            src={imageUrl}
                            alt={`Cover of ${book.title}`}
                            fill
                            className={cn(
                                "object-cover transition-all duration-300",
                                imageLoaded ? "scale-100 opacity-100" : "scale-105 opacity-0"
                            )}
                            sizes="(min-width: 768px) 33vw, 100vw"
                            priority={true}
                            quality={90}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageLoaded(true)}
                        />

                        {/* Loading skeleton */}
                        {!imageLoaded && (
                            <Skeleton className="absolute inset-0" />
                        )}
                    </div>
                </div>
            </div>
        );
    }, [book, imageLoaded]);

    // Memoize audio section to prevent unnecessary re-renders
    const audioSection = React.useMemo(() => {
        if (!book?.hasAudio) return null;

        return (
            <div>
                <h3 className="text-lg font-semibold mb-2">Audio Version</h3>
                {isAuthenticated ? (
                    <div className="flex items-center gap-4">
                        <Button>
                            <Headphones className="h-4 w-4 mr-2" />
                            Listen Now
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            {book.audioLength ?
                                formatAudioLength(book.audioLength) :
                                'Duration not available'} total length
                        </span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            Sign in to listen to the audio version.
                        </p>
                        {onLoginClick && (
                            <Button onClick={onLoginClick}>
                                Sign in to Listen
                            </Button>
                        )}
                    </div>
                )}
            </div>
        );
    }, [book, isAuthenticated, onLoginClick]);

    // Memoize book details section
    const bookDetails = React.useMemo(() => {
        if (!book) return null;

        return (
            <div className="flex-1 space-y-6">
                {/* Summary */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Summary</h3>
                    <p className="text-muted-foreground">
                        {book.summary}
                    </p>
                </div>

                <Separator />

                {/* Extract */}
                {book.extract && (
                    <>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Extract</h3>
                            {isAuthenticated ? (
                                <div className="prose prose-sm dark:prose-invert">
                                    <p>{book.extract}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-muted-foreground">
                                        Sign in to read the book extract and access full content.
                                    </p>
                                    {onLoginClick && (
                                        <Button onClick={onLoginClick}>
                                            Sign in to Read More
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                        <Separator />
                    </>
                )}

                {/* Audio Version */}
                {audioSection}

                {/* Additional Book Info */}
                {(book.rating || book.readingProgress) && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            {book.rating !== undefined && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Rating:</span>
                                    <span className="text-sm text-muted-foreground">
                                        {book.rating}/5
                                    </span>
                                </div>
                            )}
                            {book.readingProgress !== undefined && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Progress:</span>
                                    <span className="text-sm text-muted-foreground">
                                        {book.readingProgress}%
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }, [book, isAuthenticated, audioSection, onLoginClick]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex flex-col gap-0"
                style={{
                    width: 'min(calc(100vw - 2rem), 1200px)',
                    maxWidth: '100%',
                    maxHeight: 'min(calc(100vh - 2rem), 90vh)',
                    margin: '1rem auto'
                }}>
                {/* Close button */}
                <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>

                {book ? (
                    <>
                        <DialogHeader className="flex-none p-4 sm:p-6 sm:pb-4">
                            <div className="space-y-1">
                                <DialogTitle className="text-2xl">
                                    {book.title}
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-4">
                                    <span>Published {formatDate(book.publishingDate)}</span>
                                    {book.hasAudio && book.audioLength && (
                                        <span className="inline-flex items-center gap-1">
                                            <Headphones className="h-4 w-4" />
                                            {formatAudioLength(book.audioLength)}
                                        </span>
                                    )}
                                </DialogDescription>
                            </div>
                        </DialogHeader>

                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full">
                                <div className="p-4 sm:p-6">
                                    <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                                        {coverImage}
                                        {bookDetails}
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </>
                ) : (
                    <div className="p-6">
                        <div className="flex flex-col gap-4">
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <div className="flex flex-col md:flex-row gap-6">
                                <Skeleton className="w-full md:w-1/3 aspect-[3/4]" />
                                <div className="flex-1 space-y-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <Skeleton className="h-4 w-4/5" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}