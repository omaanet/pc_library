'use client';

import { useEffect, useId, useState, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { Headphones, X, BookOpen, Download, MailOpen, Loader2, Info } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAudioLength, cn, isBookEffectivelyNew } from '@/lib/utils';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';
import type { Book } from '@/types';
import BookComments from './book-comments';
import { BookExtract } from './book-extract';
import AudioBookPlayer from '../shared/AudioBookPlayer';
import { LinkButton } from '@/components/ui/LinkButton';
import { useToast } from '@/components/ui/use-toast';
import { useLibrary } from '@/context/library-context';
import { saveLibraryReturnState } from '@/lib/library-return-state';
import {
    getBookPresentationMode,
    isAudioAvailable,
    type BookPresentationMode,
} from '@/lib/book-visibility';

interface BookDialogProps {
    book: Book | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isAuthenticated?: boolean;
    onLoginClick?: () => void;
}

// Audio badge to show on the book cover if the book has audio
const renderAudioBadge = (book: Book | null, visible: boolean) => {
    if (!book || !isAudioAvailable(book)) return null;

    return (
        <div className={cn(
            "absolute -top-1 -right-1 rounded-full bg-yellow-600/90 p-1 sm:p-1.5",
            "backdrop-blur-sm transition-opacity duration-200 z-10",
            visible ? "opacity-100" : "opacity-0"
        )}>
            <Headphones className="h-3 w-3 sm:h-4 sm:w-4" />
        </div>
    );
};

const renderNewBadge = (book: Book | null, visible: boolean) => {
    if (!book) return null;
    if (!isBookEffectivelyNew(book)) return null;

    return (
        <div className={cn(
            "absolute -top-1 -left-1 rounded bg-emerald-600/90 px-2 py-0.5 text-xs font-semibold text-white",
            "backdrop-blur-sm transition-opacity duration-200 z-10",
            visible ? "opacity-100" : "opacity-0"
        )}>
            NEW
        </div>
    );
};

interface BookExtractDisclosureState {
    expanded: boolean;
    extractId: string;
    hasExtract: boolean;
    isCollapsible: boolean;
    setExpanded: (expanded: boolean) => void;
}

function useBookExtractDisclosure(
    book: Book | null,
    open: boolean,
    mode: BookPresentationMode
): BookExtractDisclosureState {
    const hasExtract = Boolean(book?.extract?.trim());
    const [expanded, setExpanded] = useState(hasExtract);
    const reactId = useId();
    const isCollapsible = mode === 'audio-only' || mode === 'reading-and-audio';

    useEffect(() => {
        setExpanded(hasExtract);
    }, [book?.id, open, hasExtract]);

    return {
        expanded,
        extractId: `book-extract-${reactId.replace(/:/g, '')}`,
        hasExtract,
        isCollapsible,
        setExpanded,
    };
}

function BookExtractToggle({ disclosure }: { disclosure: BookExtractDisclosureState }) {
    if (!disclosure.hasExtract || !disclosure.isCollapsible) return null;

    const label = disclosure.expanded ? 'Nascondi estratto' : 'Mostra estratto';

    return (
        <button
            type="button"
            className={cn(
                "group absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full",
                "text-cyan-300 transition-colors hover:bg-background/70 hover:text-cyan-100",
                "active:bg-transparent focus-visible:outline-none"
            )}
            onClick={() => disclosure.setExpanded(!disclosure.expanded)}
            aria-controls={disclosure.extractId}
            aria-expanded={disclosure.expanded}
            aria-label={label}
            title={label}
        >
            <Info
                className="h-4 w-4 rounded-full group-focus-visible:ring-2 group-focus-visible:ring-black dark:group-focus-visible:ring-white"
                aria-hidden="true"
            />
        </button>
    );
}

function BookExtractSection({
    book,
    disclosure,
}: {
    book: Book | null;
    disclosure: BookExtractDisclosureState;
}) {
    if (!book || !disclosure.hasExtract) return null;
    if (disclosure.isCollapsible && !disclosure.expanded) return null;

    return (
        <div id={disclosure.extractId} className="mt-2">
            <BookExtract extract={book.extract} />
        </div>
    );
}

function getLoginLabel(mode: BookPresentationMode, includeComments = false): string {
    const suffix = includeComments ? ' e commentare' : '';

    if (mode === 'reading-and-audio') {
        return includeComments
            ? 'Accedi per leggere, ascoltare e commentare'
            : 'Accedi per leggere e ascoltare';
    }
    if (mode === 'audio-only') return `Accedi per ascoltare${suffix}`;
    return `Accedi per leggere${suffix}`;
}

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
    const {
        state: { filters, sort, viewMode },
    } = useLibrary();
    const pendingActionRef = useRef<{ type: 'request-pdf'; bookId: string } | null>(null);
    const isReaderNavigationRef = useRef(false);
    const presentationMode = book ? getBookPresentationMode(book) : 'unavailable';
    const hasVisibleReading = presentationMode === 'reading-only' || presentationMode === 'reading-and-audio';
    const hasVisibleAudio = presentationMode === 'audio-only' || presentationMode === 'reading-and-audio';
    const extractDisclosure = useBookExtractDisclosure(book, open, presentationMode);

    const handleReaderNavigation = () => {
        if (!book) return;

        isReaderNavigationRef.current = true;
        saveLibraryReturnState({
            selectedBookId: book.id,
            filters,
            sort,
            viewMode,
        });
    };

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
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen && isReaderNavigationRef.current) return;
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent className="p-2 sm:p-4 sm:pt-0 overflow-hidden !outline-none !focus:outline-none !focus-visible:outline-none !ring-0 !focus:ring-0 !focus-visible:ring-0 !ring-offset-0 !focus:ring-offset-0">
                {/* Header with Title and Audio Length */}
                <DialogHeader className="space-y-0 p-0 sm:p-0 sm:pb-0">
                    <DialogTitle className="mt-2 sm:mt-0 text-lg font-medium text-cyan-300 line-clamp-2">
                        {book.title}
                    </DialogTitle>
                    <DialogDescription className="pb-2 sm:pb-0 text-xs text-muted-foreground flex items-center justify-center">
                        {hasVisibleAudio && book.audioLength ? (
                            <>
                                <Headphones className="h-3 w-3 mr-1" />
                                {formatAudioLength(book.audioLength)}
                            </>
                        ) : (
                            // `Published ${new Date(book.publishingDate).toLocaleDateString()}`
                            <></>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-col overflow-y-auto">
                    <div className="flex justify-center">
                        <div className={cn(
                            "relative flex w-full flex-col items-center rounded-lg bg-muted/30 px-3 py-3",
                            extractDisclosure.hasExtract && extractDisclosure.isCollapsible && "pb-12"
                        )}>
                            <div className="flex flex-col items-center space-y-2">

                                <div className="relative mx-auto aspect-[3/4] w-36 flex-shrink-0 sm:w-44 md:w-52">
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
                                            "w-full h-full object-contain transition-opacity duration-400",
                                            imageLoaded ? "opacity-100" : "opacity-0"
                                        )}
                                        sizes="(max-width: 640px) 70vw, (min-width: 768px) 33vw, 100vw"
                                        onLoad={() => setImageLoaded(true)}
                                        onError={() => setImageLoaded(true)}
                                    />
                                    {renderAudioBadge(book, imageLoaded)}
                                    {renderNewBadge(book, imageLoaded)}
                                </div>

                                {isAuthenticated && hasVisibleReading && (
                                    <div className="flex flex-row justify-center items-center gap-1 sm:gap-2 w-full">
                                        <div className="flex-1">
                                            <LinkButton url={`/read-book/${book.id}`}
                                                icon={BookOpen}
                                                onClick={handleReaderNavigation}
                                                className="h-11 w-full px-3 text-xs font-normal text-dark hover:text-white bg-cyan-600/30 hover:bg-cyan-600 border border-cyan-700 shadow select-none transition-colors duration-200 truncate focus-visible:ring-2 focus-visible:ring-cyan-400">
                                                Leggi Racconto<span className="hidden sm:inline"> on-line</span>
                                            </LinkButton>
                                        </div>

                                        <div className="flex-1">
                                            <Button
                                                onClick={handleRequestPdf}
                                                disabled={isPdfRequesting}
                                                className="h-11 w-full px-3 text-xs font-normal text-dark hover:text-white bg-emerald-700/30 hover:bg-emerald-800 border border-emerald-900 shadow select-none transition-colors duration-200 truncate focus-visible:ring-2 focus-visible:ring-emerald-400">
                                                {isPdfRequesting ? (
                                                    <>
                                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                        Invio in corso...
                                                    </>
                                                ) : (
                                                    <>
                                                        <MailOpen className="h-3 w-3 mr-1" />
                                                        Richiedi il PDF<span className="hidden sm:inline"> del Racconto</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <BookExtractToggle disclosure={extractDisclosure} />
                        </div>
                    </div>

                    <BookExtractSection book={book} disclosure={extractDisclosure} />

                    <div className="flex w-full flex-col items-stretch pt-2">
                        {isAuthenticated && hasVisibleAudio ? (
                            <AudioBookPlayer book={book} isActive={open} />
                        ) : !isAuthenticated && presentationMode !== 'unavailable' ? (
                            <Button
                                onClick={onLoginClick}
                                size="lg"
                                className="min-h-11 w-full bg-cyan-800 px-5 text-base text-cyan-50 hover:bg-emerald-900 focus-visible:ring-2 focus-visible:ring-cyan-400 sm:ml-auto sm:w-auto"
                            >
                                {getLoginLabel(presentationMode)}
                            </Button>
                        ) : null}
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
    const {
        state: { filters, sort, viewMode },
    } = useLibrary();
    const isReaderNavigationRef = useRef(false);
    const presentationMode = book ? getBookPresentationMode(book) : 'unavailable';
    const hasVisibleReading = presentationMode === 'reading-only' || presentationMode === 'reading-and-audio';
    const hasVisibleAudio = presentationMode === 'audio-only' || presentationMode === 'reading-and-audio';
    const extractDisclosure = useBookExtractDisclosure(book, open, presentationMode);

    const handleReaderNavigation = () => {
        if (!book) return;

        isReaderNavigationRef.current = true;
        saveLibraryReturnState({
            selectedBookId: book.id,
            filters,
            sort,
            viewMode,
        });
    };

    // Reset image loaded state when dialog opens/closes or book changes
    useEffect(() => {
        setImageLoaded(false);
    }, [book, open]);

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen && isReaderNavigationRef.current) return;
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent
                className="flex flex-col w-full max-w-[1200px] p-0 !outline-none !focus:outline-none !focus-visible:outline-none !ring-0 !focus:ring-0 !focus-visible:ring-0 !ring-offset-0 !focus:ring-offset-0"
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
                                    {hasVisibleAudio && book.audioLength ? (
                                        <span className="inline-flex items-center gap-1">
                                            <Headphones className="h-4 w-4" />
                                            Versione Audio: {formatAudioLength(book.audioLength)}
                                        </span>
                                    ) : (
                                        <></>
                                    )}
                                </DialogDescription>
                            </div>
                        </DialogHeader>
                        <div className="min-h-0 overflow-y-auto">
                            <div className="flex flex-col gap-y-2 px-4 pb-3 pt-0 md:flex-row md:gap-4">
                                {/* Left column: Book cover with audio badge, responsive */}
                                <div className="flex-shrink-0 flex flex-col items-center justify-start w-full md:w-1/3 md:max-w-xs mx-auto md:mx-0 mt-0 mb-2 md:mb-0">

                                    <div className={cn(
                                        "relative w-full flex flex-col items-center justify-center rounded-lg bg-muted/30 px-3 py-2 space-y-1",
                                        extractDisclosure.hasExtract && extractDisclosure.isCollapsible && "pb-12"
                                    )}>

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
                                                            "w-full h-auto max-w-[60vw] max-h-[30vh] sm:max-w-full sm:max-h-[45vh] object-contain transition-opacity duration-400",
                                                            imageLoaded ? "opacity-100" : "opacity-0"
                                                        )}
                                                        sizes="(max-width: 640px) 60vw, (min-width: 768px) 30vw, 100vw"
                                                        // priority={true}
                                                        // quality={90}
                                                        onLoad={() => setImageLoaded(true)}
                                                        onError={() => setImageLoaded(true)}
                                                    // unoptimized
                                                    />
                                                    {renderAudioBadge(book, imageLoaded)}
                                                    {renderNewBadge(book, imageLoaded)}
                                                </div>
                                            </div>

                                            {isAuthenticated && hasVisibleReading && (
                                                <div className="flex flex-row justify-center items-center gap-1 sm:gap-2 w-full">
                                                    <div className="flex-1">
                                                        <LinkButton url={`/read-book/${book.id}`} icon={BookOpen} onClick={handleReaderNavigation} className="h-11 w-full px-2 text-xs font-normal text-dark hover:text-white bg-cyan-600/30 hover:bg-cyan-600 border border-cyan-700 shadow select-none transition-colors duration-200 truncate focus-visible:ring-2 focus-visible:ring-cyan-400">
                                                            Leggi Racconto
                                                        </LinkButton>
                                                    </div>

                                                    <div className="flex-1">
                                                        <LinkButton url={`/api/download-book/${book.id}`} icon={Download} className="h-11 w-full px-2 text-xs font-normal text-dark hover:text-white bg-red-700/30 hover:bg-red-800 border border-red-900 shadow select-none transition-colors duration-200 truncate focus-visible:ring-2 focus-visible:ring-red-400">
                                                            Scarica PDF
                                                        </LinkButton>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <BookExtractToggle disclosure={extractDisclosure} />
                                    </div>

                                </div>

                                {/* Right column: Extract, Comments, Posting Form */}
                                <div className="flex flex-col md:flex-1">
                                    {/* Estratto section */}
                                    <div className="mb-3 sm:mb-2">
                                        <BookExtractSection book={book} disclosure={extractDisclosure} />

                                        {/* AudioBookPlayer: show only if authenticated and has audio */}
                                        {isAuthenticated && hasVisibleAudio && (
                                            <>
                                                {/* AudioBookPlayer is self-contained for tracks */}
                                                <AudioBookPlayer book={book} isActive={open} />
                                            </>
                                        )}

                                    </div>

                                    {/* Comments section: header, scrollable list, posting form at bottom */}
                                    <div className="flex flex-col rounded bg-muted/40 px-2 py-2 sm:px-4">
                                        <h3 className="text-md sm:text-lg font-medium mb-2 text-cyan-400">Commenti</h3>
                                        <div className="pr-1">
                                            <BookComments
                                                bookId={book.id}
                                                isAuthenticated={isAuthenticated}
                                                onLoginClick={onLoginClick}
                                            />
                                        </div>
                                    </div>
                                    {!isAuthenticated && presentationMode !== 'unavailable' && (
                                        <div className="mt-4 mb-1 flex justify-end">
                                            <Button onClick={onLoginClick} size="default" className="min-h-11 w-full bg-cyan-800 font-normal text-cyan-50 hover:bg-emerald-900 hover:text-emerald-50 focus-visible:ring-2 focus-visible:ring-cyan-400 sm:w-auto">
                                                {getLoginLabel(presentationMode, true)}
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
