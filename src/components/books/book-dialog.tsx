'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
// import Image from 'next/image';
import { Headphones, X, BookOpen, Download, MailOpen, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAudioLength, cn } from '@/lib/utils';
// import { DEFAULT_COVER_SIZES } from '@/types/images';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';
import type { Book /*, AudioBook */ } from '@/types';
import BookComments from './book-comments';
import { BookExtract } from './book-extract';
import AudioBookPlayer from '../shared/AudioBookPlayer';
import { LinkButton } from '@/components/ui/LinkButton';
import { useToast } from '@/components/ui/use-toast';

interface BookDialogProps {
    book: Book | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isAuthenticated?: boolean;
    onLoginClick?: () => void;
}

// Audio badge to show on the book cover if the book has audio
const renderAudioBadge = (book: Book | null, visible: boolean) => {
    if (!book?.hasAudio) return null;

    return (
        <div className={cn(
            "absolute -top-2 right-0 sm:top-0 sm:-right-2 rounded-full bg-yellow-600/80 p-1.5",
            "backdrop-blur-sm transition-opacity duration-200",
            visible ? "opacity-100" : "opacity-0"
        )}>
            <Headphones className="h-4 w-4 sm:h-6 sm:w-6" />
        </div>
    );
};

export function BookDialogSimple({
    book,
    open,
    onOpenChange,
    isAuthenticated = true,
    onLoginClick,
}: BookDialogProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isPdfRequesting, setIsPdfRequesting] = useState(false);
    const { toast } = useToast();
    const { state: authState } = useAuth();
    const pendingActionRef = useRef<{ type: 'request-pdf'; bookId: string } | null>(null);

    // Reset image loaded state when dialog opens/closes or book changes
    useEffect(() => {
        setImageLoaded(false);
    }, [book, open]);

    // Effect to handle authentication state changes and retry pending actions
    useEffect(() => {
        // If user just logged in and there's a pending action
        if (authState.isAuthenticated && pendingActionRef.current) {
            const pendingAction = pendingActionRef.current;

            // Clear the pending action immediately to prevent loops
            pendingActionRef.current = null;

            // Handle different action types
            if (pendingAction.type === 'request-pdf' && book?.id === pendingAction.bookId) {
                // Small delay to ensure auth is fully established
                setTimeout(() => {
                    toast({
                        title: 'Autenticazione completata',
                        description: 'Riproviamo a richiedere il PDF...',
                        variant: 'default',
                        className: 'bg-green-100 border-green-500 text-green-800'
                    });

                    // Retry the PDF request
                    handleRequestPdf();
                }, 500);
            }
        }
    }, [authState.isAuthenticated, book]);

    // Function to handle PDF request
    const handleRequestPdf = async () => {
        if (!book) return;

        setIsPdfRequesting(true);

        try {
            const response = await fetch(`/api/request-book/${book.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle 401 Unauthorized errors by showing the AuthModal
                if (response.status === 401 && onLoginClick) {
                    // Save the pending action to retry after login
                    pendingActionRef.current = {
                        type: 'request-pdf',
                        bookId: book.id
                    };

                    // Show login modal
                    onLoginClick();

                    // Display a message that login is required
                    toast({
                        title: 'Accesso richiesto',
                        description: 'Devi effettuare l\'accesso per richiedere un PDF',
                        variant: 'default',
                        className: 'bg-blue-100 border-blue-500 text-blue-800'
                    });
                } else {
                    // Handle other errors
                    throw new Error(data.error || 'Si è verificato un errore durante l\'invio della richiesta');
                }
            } else {
                // Success response
                toast({
                    title: 'Richiesta inviata',
                    description: 'La richiesta per il PDF è stata inviata con successo.',
                    variant: 'default',
                    className: 'bg-green-100 border-green-500 text-green-800'
                });
            }
        } catch (error) {
            console.error('Errore nella richiesta del PDF:', error);
            toast({
                title: 'Errore',
                description: error instanceof Error ? error.message : 'Si è verificato un errore durante l\'invio della richiesta',
                variant: 'destructive',
                className: 'bg-orange-100 border-red-600 text-red-700'
            });
        } finally {
            setIsPdfRequesting(false);
        }
    };

    if (!book) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-2 sm:p-4 overflow-hidden !outline-none !focus:outline-none !focus-visible:outline-none !ring-0 !focus:ring-0 !focus-visible:ring-0 !ring-offset-0 !focus:ring-offset-0">
                {/* Header with Title and Audio Length */}
                <DialogHeader className="space-y-0 p-0 sm:p-0 sm:pb-0">
                    <DialogTitle className="mt-2 sm:mt-0 text-lg font-medium text-cyan-300 line-clamp-2">
                        {book.title}
                    </DialogTitle>
                    {book.hasAudio && book.audioLength && (
                        <DialogDescription className="text-xs text-muted-foreground flex items-center justify-center">
                            <Headphones className="h-3 w-3 mr-1" />
                            {formatAudioLength(book.audioLength)}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex flex-col overflow-y-auto max-h-[85vh]">
                    {/* Book Cover with container similar to BookDialog */}
                    <div className="flex justify-center">
                        <div className="relative w-full flex flex-col items-center rounded-lg bg-muted/30 px-3 py-3">
                            <div className="flex flex-col items-center">

                                <div className="relative w-48 sm:w-56 md:w-64 aspect-[3/4] max-h-[60vh]">
                                    {!imageLoaded && (
                                        <Skeleton className="absolute inset-0 rounded-lg" />
                                    )}

                                    <img
                                        src={getCoverImageUrl(
                                            book.coverImage,
                                            'detail',
                                            { bookId: book.coverImage === IMAGE_CONFIG.placeholder.token ? book.id : undefined }
                                        )}
                                        alt={`Cover of ${book.title}`}
                                        className={cn(
                                            "w-full h-auto sm:max-w-full sm:max-h-[60vh] object-contain transition-opacity duration-400",
                                            imageLoaded ? "opacity-100" : "opacity-0"
                                        )}
                                        sizes="(max-width: 640px) 70vw, (min-width: 768px) 33vw, 100vw"
                                        onLoad={() => setImageLoaded(true)}
                                        onError={() => setImageLoaded(true)}
                                    />
                                    {renderAudioBadge(book, imageLoaded)}
                                </div>

                                {/* Actions positioned like in BookDialog */}
                                {isAuthenticated /*&& !book.hasAudio*/ && (
                                    <div className="flex flex-row justify-between items-center gap-4 my-1">
                                        <div className="text-center ">
                                            <LinkButton url={`/read-book/${book.id}`}
                                                icon={BookOpen}
                                                className="p-2 sm:p-5 text-sm sm:text-base font-normal text-dark hover:text-white bg-cyan-600/30 hover:bg-cyan-600 border border-cyan-700 mt-1 sm:mt-0 shadow select-none">
                                                Leggi<span className="hidden sm:block">Racconto</span> on-line
                                            </LinkButton>
                                        </div>

                                        <div className="text-center">
                                            <Button
                                                onClick={handleRequestPdf}
                                                disabled={isPdfRequesting}
                                                className="p-2 sm:p-5 text-sm sm:text-base font-normal text-dark hover:text-white bg-emerald-700/30 hover:bg-emerald-800 border border-emerald-900 mt-1 sm:mt-0 shadow select-none">
                                                {isPdfRequesting ? (
                                                    <>
                                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                        Invio in corso...
                                                    </>
                                                ) : (
                                                    <>
                                                        <MailOpen className="h-8 w-8 mr-2" />
                                                        Richiedi il PDF<span className="hidden sm:block">del Racconto</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse">
                        <div className="px-0 flex flex-col items-end">
                            {isAuthenticated && book.hasAudio ? (
                                <AudioBookPlayer book={book} />
                            ) : !isAuthenticated && (
                                <Button
                                    onClick={onLoginClick}
                                    size="lg"
                                    className="mt-3 px-5 text-base bg-cyan-800 hover:bg-emerald-900 text-cyan-50"
                                >
                                    {book.hasAudio ? 'Accedi per ascoltare' : 'Accedi per leggere'}
                                </Button>
                            )}
                        </div>

                        {/* Book Extract - Auto height with scrolling when needed */}
                        <div className="overflow-y-auto mt-1 sm:mt-2 px-0" style={{ maxHeight: 'min(25vh, 20ch)' }}>
                            <BookExtract extract={book.extract} />
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}

export function BookDialog({
    book,
    open,
    onOpenChange,
    isAuthenticated = true,
    onLoginClick,
}: BookDialogProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    // Reset image loaded state when dialog opens/closes or book changes
    useEffect(() => {
        setImageLoaded(false);
    }, [book, open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex flex-col h-full max-h-[95vh] w-full max-w-[1200px] p-0 overflow-auto !outline-none !focus:outline-none !focus-visible:outline-none !ring-0 !focus:ring-0 !focus-visible:ring-0 !ring-offset-0 !focus:ring-offset-0"
                style={{ margin: '0 auto 0 auto' }}
            >
                {/* Close button */}
                <DialogClose
                    className="!outline-none !focus:outline-none !focus-visible:outline-none !ring-0 !focus:ring-0 !focus-visible:ring-0 !ring-offset-0 !focus:ring-offset-0 border-none absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="hidden sm:block">Close</span>
                </DialogClose>
                {book ? (
                    <>
                        <DialogHeader className="flex-none p-0">
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
                            <div className="flex flex-1 flex-col md:flex-row gap-y-2 md:gap-4 h-full min-h-0 px-4 pt-0 pb-3">
                                {/* Left column: Book cover with audio badge, responsive */}
                                <div className="flex flex-col items-center justify-center w-full md:w-1/3 ma2x-w-[320px] md:max-w-xs mx-auto md:mx-0 h-auto min-h-0 mt-0 mb-0">

                                    <div className="relative w-full h-full flex flex-col sm:flex-col items-center justify-center rounded-lg bg-muted/30 px-3 py-2 space-y-1">

                                        <div className="">
                                            <div>
                                                {/* Responsive image wrapper for mobile: w-fu2ll h-auto m2ax-h-full | !imageLoaded */}
                                                {!imageLoaded && (
                                                    <Skeleton className="absolute inset-0 rounded-lg" />
                                                )}
                                                <div>
                                                    <img
                                                        src={getCoverImageUrl(
                                                            book.coverImage,
                                                            'detail',
                                                            { bookId: book.coverImage === IMAGE_CONFIG.placeholder.token ? book.id : undefined }
                                                        )}
                                                        alt={`Cover of ${book.title}`}
                                                        className={cn(
                                                            "w-full h-auto max-w-[70vw] max-h-[25vw] sm:max-w-full sm:max-h-[60vh] object-contain transition-opacity duration-400",
                                                            imageLoaded ? "opacity-100" : "opacity-0"
                                                        )}
                                                        sizes="(max-width: 640px) 70vw, (min-width: 768px) 33vw, 100vw"
                                                        // priority={true}
                                                        // quality={90}
                                                        onLoad={() => setImageLoaded(true)}
                                                        onError={() => setImageLoaded(true)}
                                                    // unoptimized
                                                    />
                                                    {renderAudioBadge(book, imageLoaded)}
                                                </div>
                                            </div>

                                            {isAuthenticated /*&& !book.hasAudio*/ && (
                                                <div className="flex flex-row justify-between items-center gap-2">
                                                    <div className="text-center ">
                                                        <LinkButton url={`/read-book/${book.id}`} icon={BookOpen} className="text-dark hover:text-white bg-cyan-600/30 hover:bg-cyan-600 border border-cyan-700 mt-1 sm:mt-0 h-8 sm:h-auto font-light shadow select-none">
                                                            Leggi
                                                        </LinkButton>
                                                    </div>

                                                    <div className="text-center">
                                                        <LinkButton url={`/api/download-book/${book.id}`} icon={Download} className="text-dark hover:text-white bg-red-700/30 hover:bg-red-800 border border-red-900 mt-1 sm:mt-0 h-8 sm:h-auto font-light shadow select-none">
                                                            Scarica PDF
                                                        </LinkButton>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                </div>

                                {/* Right column: Extract, Comments, Posting Form */}
                                <div className="flex-1 flex flex-col h-full min-h-0">
                                    {/* Estratto section */}
                                    <div className="mb-3 sm:mb-2">
                                        <BookExtract extract={book.extract} />

                                        {/* AudioBookPlayer: show only if authenticated and has audio */}
                                        {isAuthenticated && book.hasAudio && (
                                            <>
                                                {/* AudioBookPlayer is self-contained for tracks */}
                                                <AudioBookPlayer book={book} />
                                            </>
                                        )}

                                    </div>

                                    {/* Comments section: header, scrollable list, posting form at bottom */}
                                    <div className="flex-1 flex flex-col min-h-0 bg-muted/40 rounded px-4 py-2">
                                        <h3 className="text-md sm:text-lg font-medium mb-2 text-cyan-400">Commenti</h3>
                                        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                                            <BookComments
                                                bookId={book.id}
                                                isAuthenticated={isAuthenticated}
                                                onLoginClick={onLoginClick}
                                            />
                                        </div>
                                    </div>
                                    {!isAuthenticated && (
                                        <div className="mt-4 mb-1 flex justify-end">
                                            <Button onClick={onLoginClick} size="default" className="bg-cyan-800 hover:bg-emerald-900 text-cyan-50 hover:text-emerald-50 font-normal">
                                                {book?.hasAudio ? 'Accedi per ascoltare e commentare' : 'Accedi per leggere e commentare'}
                                            </Button>
                                        </div>
                                    )}
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