'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Headphones, X, BookOpen } from 'lucide-react';
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
import { formatAudioLength, cn } from '@/lib/utils';
import { DEFAULT_COVER_SIZES } from '@/types/images';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';
import type { Book } from '@/types';
import { BookComments } from './book-comments';
import { BookExtract } from './book-extract';

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
    isAuthenticated = true,
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
        // const aspectRatio = width / height;
        const isPlaceholder = book.coverImage === IMAGE_CONFIG.placeholder.token;
        const imageUrl = getCoverImageUrl(
            book.coverImage,
            'detail',
            { bookId: isPlaceholder ? book.id : undefined }
        );

        return (
            <div className="relative w-2/3 md:w-1/3 shrink-0">
                <div
                    className="relative w-full rounded-lg bg-muted/30"

                >
                    {/* Loading skeleton - shown only during loading */}
                    {!imageLoaded && (
                        <Skeleton className="absolute inset-0 rounded-lg" />
                    )}

                    {/* Main image container */}
                    <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                            src={imageUrl}
                            alt={`Cover of ${book.title}`}
                            width={width}
                            height={height}
                            className={cn(
                                "max-w-full max-h-full object-contain transition-opacity duration-400",
                                // `aspect-[${width}/${height}]`,
                                imageLoaded ? "opacity-100" : "opacity-0"
                            )}
                            sizes="(min-width: 768px) 33vw, 100vw"
                            priority={true}
                            quality={90}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageLoaded(true)}
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
                </div>
            </div>
        );
    }, [book, imageLoaded]);

    // Audio badge to show on the book cover if the book has audio
    const renderAudioBadge = (book: Book | null, visible: boolean) => {
        if (!book?.hasAudio) return null;
        
        return (
            <div className={cn(
                "absolute top-2 right-2 rounded-full bg-yellow-600/80 p-1.5",
                "backdrop-blur-sm transition-opacity duration-200",
                visible ? "opacity-100" : "opacity-0"
            )}>
                <Headphones className="h-6 w-6" />
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex flex-col h-full max-h-[90vh] w-full max-w-[1200px] p-0"
                style={{ margin: '1rem auto' }}
            >
                {/* Close button */}
                <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>
                {book ? (
                    <>
                        <DialogHeader className="flex-none p-4 sm:p-6 sm:pb-4">
                            <div className="space-y-1">
                                <DialogTitle className="text-2xl text-cyan-300">
                                    {book.title}
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-4">
                                    {book.hasAudio && book.audioLength && (
                                        <span className="inline-flex items-center gap-1">
                                            <Headphones className="h-4 w-4" />
                                            Versione Audio: {formatAudioLength(book.audioLength)}
                                        </span>
                                    )}
                                </DialogDescription>
                            </div>
                        </DialogHeader>
                        <div className="flex-1 flex flex-col h-full min-h-0">
                            <div className="flex flex-1 flex-col md:flex-row gap-6 h-full min-h-0 p-4 sm:p-6">
                                {/* Left column: Book cover with audio badge, responsive */}
                                <div className="flex flex-col items-center justify-center w-full md:w-1/3 max-w-xs mx-auto md:mx-0 h-full min-h-0">
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <div className="relative w-full h-auto max-h-full rounded-lg bg-muted/30 flex items-center justify-center p-2">
                                            {!imageLoaded && (
                                                <Skeleton className="absolute inset-0 rounded-lg" />
                                            )}
                                            <Image
                                                src={getCoverImageUrl(
                                                    book.coverImage,
                                                    'detail',
                                                    { bookId: book.coverImage === IMAGE_CONFIG.placeholder.token ? book.id : undefined }
                                                )}
                                                alt={`Cover of ${book.title}`}
                                                width={DEFAULT_COVER_SIZES.detail.width}
                                                height={DEFAULT_COVER_SIZES.detail.height}
                                                className={cn(
                                                    "w-auto h-auto max-h-[60vh] max-w-full object-contain transition-opacity duration-400",
                                                    imageLoaded ? "opacity-100" : "opacity-0"
                                                )}
                                                sizes="(min-width: 768px) 33vw, 100vw"
                                                priority={true}
                                                quality={90}
                                                onLoad={() => setImageLoaded(true)}
                                                onError={() => setImageLoaded(true)}
                                                unoptimized
                                            />
                                            {renderAudioBadge(book, imageLoaded)}
                                        </div>
                                    </div>
                                </div>
                                {/* Right column: Extract, Comments, Posting Form */}
                                <div className="flex-1 flex flex-col h-full min-h-0">
                                    {/* Estratto section */}
                                    <div className="mb-3">
                                        <BookExtract bookId={book.id} />
                                    </div>
                                    {/* Comments section: header, scrollable list, posting form at bottom */}
                                    <div className="flex-1 flex flex-col min-h-0 bg-muted/40 rounded p-2">
                                        <h3 className="text-md sm:text-lg font-medium mb-2 text-cyan-400">Commenti</h3>
                                        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                                            <BookComments
                                                bookId={book.id}
                                                isAuthenticated={isAuthenticated}
                                                onLoginClick={onLoginClick}
                                            />
                                        </div>
                                        {!isAuthenticated && (
                                            <div className="mt-2">
                                                <Button onClick={onLoginClick}>Accedi per commentare</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
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