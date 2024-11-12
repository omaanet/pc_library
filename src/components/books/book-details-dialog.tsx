// src/components/books/book-details-dialog.tsx
import React from 'react';
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

interface BookDetailsDialogProps {
    book: Book | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isAuthenticated?: boolean;
    onLoginClick?: () => void;
}

export function BookDetailsDialog({
    book,
    open,
    onOpenChange,
    isAuthenticated = false,
    onLoginClick,
}: BookDetailsDialogProps) {
    if (!book) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] p-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <div className="space-y-1">
                        <DialogTitle className="text-2xl">
                            {book.title}
                        </DialogTitle>
                        <DialogDescription>
                            Published {formatDate(book.publishingDate)}
                            {book.hasAudio && book.audioLength && (
                                <span className="ml-4 inline-flex items-center gap-1">
                                    <Headphones className="h-4 w-4" />
                                    {formatAudioLength(book.audioLength)}
                                </span>
                            )}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <ScrollArea className="h-full px-6 pb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Cover Image */}
                        <div className="relative w-full md:w-1/3 aspect-[3/4] overflow-hidden rounded-lg">
                            <Image
                                src={book.coverImage}
                                alt={`Cover of ${book.title}`}
                                fill
                                className="object-cover"
                                sizes="(min-width: 768px) 33vw, 100vw"
                                priority
                            />
                        </div>

                        {/* Book Details */}
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
                                                <Button onClick={onLoginClick}>
                                                    Sign in to Read More
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <Separator />
                                </>
                            )}

                            {/* Audio Version */}
                            {book.hasAudio && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Audio Version</h3>
                                    {isAuthenticated ? (
                                        <div className="flex items-center gap-4">
                                            <Button>
                                                <Headphones className="h-4 w-4 mr-2" />
                                                Listen Now
                                            </Button>
                                            <span className="text-sm text-muted-foreground">
                                                {formatAudioLength(book.audioLength || 0)} total length
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="text-muted-foreground">
                                                Sign in to listen to the audio version.
                                            </p>
                                            <Button onClick={onLoginClick}>
                                                Sign in to Listen
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

export default BookDetailsDialog;