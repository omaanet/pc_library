// src/components/books/book-dialog.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Headphones } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatAudioLength } from '@/lib/utils';
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
    // Memoize cover image to prevent unnecessary re-renders
    const coverImage = React.useMemo(() => {
        if (!book?.coverImage) return null;

        return (
            <div className="relative w-full md:w-1/3 aspect-[3/4] overflow-hidden rounded-lg shrink-0">
                <Image
                    src={book.coverImage}
                    alt={`Cover of ${book.title}`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 33vw, 100vw"
                    priority
                />
            </div>
        );
    }, [book]);

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
                            {book.audioLength ? formatAudioLength(book.audioLength) : 'Duration not available'} total length
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
            <DialogContent className="max-w-3xl flex flex-col gap-0 p-0 max-h-[90vh]">
                {book ? (
                    <>
                        <DialogHeader className="flex-none px-6 pt-6 pb-4">
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
                                <div className="px-6 pb-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {coverImage}
                                        {bookDetails}
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </>
                ) : (
                    <div className="p-6">
                        <DialogTitle className="text-2xl mb-2">
                            Loading...
                        </DialogTitle>
                        <DialogDescription>
                            Please wait while we load the book details.
                        </DialogDescription>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default BookDialog;