'use client';

import { useEffect, useId, useState, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { Headphones, X, BookOpen, Download, MailOpen, Loader2, Info, MessageSquare, Send } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { formatAudioLength, cn, isBookEffectivelyNew } from '@/lib/utils';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';
import type { Book } from '@/types';
import BookComments from './book-comments';
import { BookCoverLightbox } from './book-cover-lightbox';
import { BookCoverPresentation } from './book-cover-presentation';
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
import { useBookAccess } from '@/context/book-access-context';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const DEFAULT_DEVELOPMENT_EMAIL = 'oscar@omaa.it';

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
            "book-availability-badge-colors absolute -top-1 -right-1 rounded-full p-1 sm:p-1.5",
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
            "book-new-badge-colors absolute -top-1 -left-1 rounded px-2 py-0.5 text-xs font-semibold",
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
                "group absolute bottom-1 right-1 z-20 flex h-11 w-11 items-center justify-center gap-1.5 rounded-full px-0 sm:w-auto sm:px-3",
                "text-sky-700 transition-colors hover:bg-background/70 hover:text-sky-900",
                "dark:text-cyan-300 dark:hover:text-cyan-100",
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
            <span className="hidden text-sm font-medium sm:inline">Estratto</span>
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

function hasBookDialogMetadata(book: Book, hasVisibleReading: boolean, hasVisibleAudio: boolean): boolean {
    const hasPageCount = hasVisibleReading
        && typeof book.pagesCount === 'number'
        && Number.isFinite(book.pagesCount)
        && book.pagesCount > 0;
    const hasAudioDuration = hasVisibleAudio
        && typeof book.audioLength === 'number'
        && Number.isFinite(book.audioLength)
        && book.audioLength > 0;

    return hasPageCount || hasAudioDuration;
}

function BookDialogMetadata({
    book,
    hasVisibleReading,
    hasVisibleAudio,
}: {
    book: Book;
    hasVisibleReading: boolean;
    hasVisibleAudio: boolean;
}) {
    const pagesCount = hasVisibleReading
        && typeof book.pagesCount === 'number'
        && Number.isFinite(book.pagesCount)
        && book.pagesCount > 0
        ? Math.trunc(book.pagesCount)
        : null;
    const audioLength = hasVisibleAudio
        && typeof book.audioLength === 'number'
        && Number.isFinite(book.audioLength)
        && book.audioLength > 0
        ? book.audioLength
        : null;

    return (
        <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {pagesCount !== null && (
                <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3 w-3" aria-hidden="true" />
                    {pagesCount} {pagesCount === 1 ? 'pagina' : 'pagine'}
                </span>
            )}
            {audioLength !== null && (
                <span className="inline-flex items-center gap-1">
                    <Headphones className="h-3 w-3" aria-hidden="true" />
                    {formatAudioLength(audioLength)}
                </span>
            )}
        </span>
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
    const [isPdfRequesting, setIsPdfRequesting] = useState(false);
    const [isAuthorMessageOpen, setIsAuthorMessageOpen] = useState(false);
    const [authorMessage, setAuthorMessage] = useState('');
    const [authorMessageRecipient, setAuthorMessageRecipient] = useState(DEFAULT_DEVELOPMENT_EMAIL);
    const [isAuthorMessageSending, setIsAuthorMessageSending] = useState(false);
    const [isCoverZoomOpen, setIsCoverZoomOpen] = useState(false);
    const { toast } = useToast();
    const { state: authState } = useAuth();
    const { requireAuthenticationForBookAccess } = useBookAccess();
    const {
        state: { filters, sort, viewMode },
    } = useLibrary();
    const pendingActionRef = useRef<{
        type: 'request-pdf';
        bookId: string;
    } | null>(null);
    const isReaderNavigationRef = useRef(false);
    const coverZoomTriggerRef = useRef<HTMLButtonElement>(null);
    const presentationMode = book ? getBookPresentationMode(book) : 'unavailable';
    const hasVisibleReading = presentationMode === 'reading-only' || presentationMode === 'reading-and-audio';
    const hasVisibleAudio = presentationMode === 'audio-only' || presentationMode === 'reading-and-audio';
    const canAccessBookFeatures = isAuthenticated || !requireAuthenticationForBookAccess;
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

    const handleCoverZoomOpenChange = (nextOpen: boolean) => {
        setIsCoverZoomOpen(nextOpen);

        if (!nextOpen) {
            requestAnimationFrame(() => coverZoomTriggerRef.current?.focus());
        }
    };

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

    useEffect(() => {
        setAuthorMessage('');
        setIsAuthorMessageOpen(false);
    }, [book?.id]);

    // Function to handle PDF request
    const handleRequestPdf = async () => {
        if (!book) return;

        if (!authState.isAuthenticated) {
            pendingActionRef.current = {
                type: 'request-pdf',
                bookId: book.id,
            };
            onLoginClick?.();
            toast({
                title: 'Accesso richiesto',
                description: 'Devi effettuare l\'accesso per richiedere un PDF',
                variant: 'default',
                className: 'bg-blue-100 border-blue-500 text-blue-800',
            });
            return;
        }

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

    const handleOpenAuthorMessage = () => {
        if (!book) return;
        setIsAuthorMessageOpen(true);
    };

    const handleSendAuthorMessage = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!book || !authorMessage.trim()) return;

        setIsAuthorMessageSending(true);

        try {
            const csrfResponse = await fetch('/api/csrf-token', {
                credentials: 'include',
            });
            if (!csrfResponse.ok) {
                throw new Error('Impossibile preparare l\'invio. Riprova.');
            }

            const { token } = await csrfResponse.json() as { token: string };
            const response = await fetch(`/api/books/${book.id}/author-message`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': token,
                },
                body: JSON.stringify({
                    message: authorMessage.trim(),
                    ...(IS_DEVELOPMENT && { destinationEmail: authorMessageRecipient.trim() }),
                }),
            });
            const data = await response.json() as { error?: string };

            if (!response.ok) {
                throw new Error(data.error || 'Si è verificato un errore durante l\'invio del messaggio.');
            }

            setAuthorMessage('');
            setIsAuthorMessageOpen(false);
            toast({
                title: 'Messaggio inviato',
                description: 'Il tuo messaggio è stato inviato all\'autore.',
                variant: 'default',
                className: 'bg-green-100 border-green-500 text-green-800',
            });
        } catch (error) {
            console.error('Errore durante l\'invio del messaggio all\'autore:', error);
            toast({
                title: 'Errore',
                description: error instanceof Error
                    ? error.message
                    : 'Si è verificato un errore durante l\'invio del messaggio.',
                variant: 'destructive',
                className: 'bg-orange-100 border-red-600 text-red-700',
            });
        } finally {
            setIsAuthorMessageSending(false);
        }
    };

    if (!book) return null;

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen && isReaderNavigationRef.current) return;
                    if (!nextOpen) setIsCoverZoomOpen(false);
                    onOpenChange(nextOpen);
                }}
            >
                <DialogContent className="p-2 sm:p-4 sm:pt-0 overflow-hidden !outline-none !focus:outline-none !focus-visible:outline-none !ring-0 !focus:ring-0 !focus-visible:ring-0 !ring-offset-0 !focus:ring-offset-0">
                {/* Header with Title and Audio Length */}
                <DialogHeader className="space-y-0 p-0 sm:p-0 sm:pb-0">
                    <DialogTitle className="mt-2 sm:mt-0 text-xl font-medium text-sky-700 dark:text-cyan-300 line-clamp-2">
                        {book.title}
                    </DialogTitle>
                    {hasBookDialogMetadata(book, hasVisibleReading, hasVisibleAudio) && (
                        <DialogDescription className="pb-2 text-xs text-muted-foreground sm:pb-0">
                            <BookDialogMetadata
                                book={book}
                                hasVisibleReading={hasVisibleReading}
                                hasVisibleAudio={hasVisibleAudio}
                            />
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="flex min-h-0 flex-col overflow-y-auto">
                    <div className="flex justify-center">
                        <div className="relative flex w-full flex-col items-center rounded-lg bg-muted/30 px-3 py-3">
                            <div className="flex w-full flex-col items-center gap-3">

                                <button
                                    ref={coverZoomTriggerRef}
                                    type="button"
                                    className="cursor-zoom-in rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                    onClick={() => setIsCoverZoomOpen(true)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            setIsCoverZoomOpen(true);
                                        }
                                    }}
                                    aria-label={`Ingrandisci la copertina di ${book.title}`}
                                >
                                    <BookCoverPresentation
                                        book={book}
                                        size="dialog"
                                        alt={`Copertina di ${book.title}`}
                                        className="mx-auto flex aspect-[400/567] w-44 max-w-[calc((100dvh-5rem)*400/567)] flex-shrink-0 sm:w-56 md:w-64"
                                        imageClassName="h-full w-full"
                                        skeletonClassName="rounded-lg"
                                        sizes="(max-width: 640px) 11rem, (max-width: 767px) 14rem, 16rem"
                                    />
                                </button>

                                <div
                                    className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-2"
                                    aria-label="Azioni disponibili per il racconto"
                                >
                                        {canAccessBookFeatures && hasVisibleReading && (
                                            <LinkButton
                                                url={`/read-book/${book.id}`}
                                                icon={BookOpen}
                                                iconSize="h-4 w-4 !mr-0"
                                                onClick={handleReaderNavigation}
                                                className={cn(
                                                    "h-10 w-auto justify-start rounded-md border px-3 py-1 text-left",
                                                    "transition-[background-color,border-color,color] duration-200",
                                                    "border-cyan-700/75 bg-cyan-600/30 text-cyan-950 hover:border-cyan-700 hover:bg-cyan-600/45",
                                                    "focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
                                                    "dark:border-cyan-600 dark:bg-cyan-900 dark:text-cyan-50 dark:hover:border-cyan-500 dark:hover:bg-cyan-800"
                                                )}
                                            >
                                                <span className="text-xs font-semibold sm:text-sm">
                                                    Leggi online
                                                </span>
                                            </LinkButton>
                                        )}

                                        {isAuthenticated && hasVisibleReading && (
                                            <Button
                                                onClick={handleRequestPdf}
                                                disabled={isPdfRequesting}
                                                className={cn(
                                                    "h-10 w-auto justify-start rounded-md border px-3 py-1 text-left",
                                                    "transition-[background-color,border-color,color] duration-200",
                                                    "border-emerald-800/70 bg-emerald-700/30 text-emerald-950 hover:border-emerald-800 hover:bg-emerald-700/45",
                                                    "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
                                                    "dark:border-emerald-700 dark:bg-emerald-900 dark:text-emerald-50 dark:hover:border-emerald-600 dark:hover:bg-emerald-800"
                                                )}
                                            >
                                                {isPdfRequesting ? (
                                                    <Loader2 className="!h-4 !w-4 animate-spin" aria-hidden="true" />
                                                ) : (
                                                    <MailOpen className="!h-4 !w-4" aria-hidden="true" />
                                                )}
                                                <span className="text-xs font-semibold sm:text-sm">
                                                    {isPdfRequesting ? 'Invio...' : 'Richiedi PDF'}
                                                </span>
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            onClick={handleOpenAuthorMessage}
                                            className={cn(
                                                "h-10 w-auto justify-start rounded-md border px-3 py-1 text-left",
                                                "transition-[background-color,border-color,color] duration-200",
                                                "border-violet-800/70 bg-violet-700/30 text-violet-950 hover:border-violet-800 hover:bg-violet-700/45",
                                                "focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
                                                "dark:border-violet-700 dark:bg-violet-900 dark:text-violet-50 dark:hover:border-violet-600 dark:hover:bg-violet-800"
                                            )}
                                        >
                                            <MessageSquare className="!h-4 !w-4" aria-hidden="true" />
                                            <span className="text-xs font-semibold sm:text-sm">
                                                Scrivi all'autore
                                            </span>
                                        </Button>
                                </div>
                            </div>
                            <BookExtractToggle disclosure={extractDisclosure} />
                        </div>
                    </div>

                    <BookExtractSection book={book} disclosure={extractDisclosure} />

                    <div className="flex w-full flex-col items-stretch pt-2">
                        {canAccessBookFeatures && hasVisibleAudio ? (
                            <AudioBookPlayer book={book} isActive={open} />
                        ) : !canAccessBookFeatures && presentationMode !== 'unavailable' ? (
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

            <Dialog open={isAuthorMessageOpen} onOpenChange={(nextOpen) => {
                if (!isAuthorMessageSending) setIsAuthorMessageOpen(nextOpen);
            }}>
                <DialogContent className="sm:max-w-lg">
                    <form className="flex min-h-0 flex-col" onSubmit={handleSendAuthorMessage}>
                        <DialogHeader className="px-6 pb-3 pt-6 sm:px-8 sm:pb-4 sm:pt-7">
                            <DialogTitle>Scrivi all'autore</DialogTitle>
                            <DialogDescription>
                                Invia un messaggio riguardo a “{book.title}”.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-4 sm:px-8 sm:py-5">
                            {IS_DEVELOPMENT && (
                                <div className="space-y-2">
                                    <Label htmlFor="author-message-recipient">
                                        Email destinatario
                                        <span className="ml-1 font-normal text-muted-foreground">(sviluppo)</span>
                                    </Label>
                                    <Input
                                        id="author-message-recipient"
                                        type="email"
                                        value={authorMessageRecipient}
                                        onChange={(event) => setAuthorMessageRecipient(event.target.value)}
                                        required
                                        disabled={isAuthorMessageSending}
                                        autoComplete="off"
                                        autoFocus
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="author-message">Messaggio</Label>
                                <Textarea
                                    id="author-message"
                                    value={authorMessage}
                                    onChange={(event) => setAuthorMessage(event.target.value)}
                                    placeholder="Scrivi qui il tuo messaggio..."
                                    className="min-h-36 resize-y"
                                    maxLength={5000}
                                    required
                                    autoFocus={!IS_DEVELOPMENT}
                                    disabled={isAuthorMessageSending}
                                />
                            </div>
                        </div>
                        <DialogFooter className="shrink-0 gap-2 border-t bg-muted/20 px-6 py-4 sm:gap-0 sm:px-8 sm:py-5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAuthorMessageOpen(false)}
                                disabled={isAuthorMessageSending}
                            >
                                Annulla
                            </Button>
                            <Button
                                type="submit"
                                disabled={isAuthorMessageSending || !authorMessage.trim()}
                                className="bg-violet-700 text-white hover:bg-violet-800"
                            >
                                {isAuthorMessageSending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                Invia
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <BookCoverLightbox
                book={book}
                open={isCoverZoomOpen}
                onOpenChange={handleCoverZoomOpenChange}
            />
        </>
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
    const { requireAuthenticationForBookAccess } = useBookAccess();
    const {
        state: { filters, sort, viewMode },
    } = useLibrary();
    const isReaderNavigationRef = useRef(false);
    const presentationMode = book ? getBookPresentationMode(book) : 'unavailable';
    const hasVisibleReading = presentationMode === 'reading-only' || presentationMode === 'reading-and-audio';
    const hasVisibleAudio = presentationMode === 'audio-only' || presentationMode === 'reading-and-audio';
    const canAccessBookFeatures = isAuthenticated || !requireAuthenticationForBookAccess;
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
                                <DialogTitle className="text-2xl text-sky-700 dark:text-cyan-300">
                                    {book.title}
                                </DialogTitle>
                                {hasBookDialogMetadata(book, hasVisibleReading, hasVisibleAudio) && (
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        <BookDialogMetadata
                                            book={book}
                                            hasVisibleReading={hasVisibleReading}
                                            hasVisibleAudio={hasVisibleAudio}
                                        />
                                    </DialogDescription>
                                )}
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
                                                            {
                                                                bookId: book.coverImage === IMAGE_CONFIG.placeholder.token ? book.id : undefined,
                                                                cacheKey: book.updatedAt,
                                                            }
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

                                            {canAccessBookFeatures && hasVisibleReading && (
                                                <div className="flex flex-row justify-center items-center gap-1 sm:gap-2 w-full">
                                                    <div className="flex-1">
                                                        <LinkButton url={`/read-book/${book.id}`} icon={BookOpen} onClick={handleReaderNavigation} className="h-11 w-full px-2 text-xs font-normal text-dark hover:text-white bg-cyan-600/30 hover:bg-cyan-600 border border-cyan-700 shadow select-none transition-colors duration-200 truncate focus-visible:ring-2 focus-visible:ring-cyan-400">
                                                            Leggi Racconto
                                                        </LinkButton>
                                                    </div>

                                                    {isAuthenticated && (
                                                        <div className="flex-1">
                                                            <LinkButton url={`/api/download-book/${book.id}`} icon={Download} className="h-11 w-full px-2 text-xs font-normal text-dark hover:text-white bg-red-700/30 hover:bg-red-800 border border-red-900 shadow select-none transition-colors duration-200 truncate focus-visible:ring-2 focus-visible:ring-red-400">
                                                                Scarica PDF
                                                            </LinkButton>
                                                        </div>
                                                    )}
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

                                        {canAccessBookFeatures && hasVisibleAudio && (
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
                                                {canAccessBookFeatures
                                                    ? hasVisibleReading
                                                        ? 'Accedi per ottenere il PDF e commentare'
                                                        : 'Accedi per commentare'
                                                    : getLoginLabel(presentationMode, true)}
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
