'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Fullscreen, Loader2, Minimize, X } from 'lucide-react';
import type { Book } from '@/types';
import { BookCoverPresentation } from './book-cover-presentation';

interface BookCoverLightboxProps {
    book: Book;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const controlClassName = [
    'inline-flex h-11 w-11 items-center justify-center rounded-full',
    'bg-black/55 text-white shadow-lg backdrop-blur-sm transition-colors',
    'hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black',
].join(' ');

export function BookCoverLightbox({
    book,
    open,
    onOpenChange,
}: BookCoverLightboxProps) {
    const viewerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isFullscreenSupported, setIsFullscreenSupported] = useState(false);

    const exitViewerFullscreen = useCallback(() => {
        if (
            document.fullscreenElement === viewerRef.current &&
            document.exitFullscreen
        ) {
            void document.exitFullscreen().catch((error) => {
                console.error('Impossibile uscire dalla modalità schermo intero:', error);
            });
        }
    }, []);

    const handleOpenChange = useCallback((nextOpen: boolean) => {
        if (!nextOpen) {
            exitViewerFullscreen();
        }

        onOpenChange(nextOpen);
    }, [exitViewerFullscreen, onOpenChange]);

    const toggleFullscreen = useCallback(async () => {
        const viewer = viewerRef.current;
        if (!viewer || !isFullscreenSupported) return;

        try {
            if (document.fullscreenElement === viewer) {
                await document.exitFullscreen();
                return;
            }

            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }

            await viewer.requestFullscreen();
        } catch (error) {
            console.error('Impossibile cambiare la modalità schermo intero:', error);
        }
    }, [isFullscreenSupported]);

    useEffect(() => {
        const viewer = viewerRef.current;
        setIsFullscreenSupported(Boolean(
            open &&
            document.fullscreenEnabled &&
            viewer?.requestFullscreen
        ));

        const syncFullscreenState = () => {
            setIsFullscreen(document.fullscreenElement === viewerRef.current);
        };

        document.addEventListener('fullscreenchange', syncFullscreenState);
        syncFullscreenState();

        return () => {
            document.removeEventListener('fullscreenchange', syncFullscreenState);

            if (viewer && document.fullscreenElement === viewer) {
                void document.exitFullscreen().catch(() => undefined);
            }
        };
    }, [open]);

    return (
        <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className="fixed inset-0 z-[71] flex bg-transparent p-0 focus:outline-none"
                    onCloseAutoFocus={(event) => event.preventDefault()}
                >
                    <DialogPrimitive.Title className="sr-only">
                        Copertina ingrandita di {book.title}
                    </DialogPrimitive.Title>

                    <div
                        ref={viewerRef}
                        className="relative flex h-full w-full items-center justify-center bg-black/95 p-4"
                    >
                        <div
                            aria-hidden="true"
                            className="absolute inset-0"
                            onClick={() => handleOpenChange(false)}
                        />

                        <div
                            className="relative z-10 flex max-h-full max-w-full cursor-zoom-out"
                            style={{
                                aspectRatio: '1200 / 1701',
                                height: 'min(calc(100dvh - 2rem), calc((100vw - 2rem) * 1701 / 1200), 1701px)',
                            }}
                            onClick={() => handleOpenChange(false)}
                        >
                            <BookCoverPresentation
                                book={book}
                                size="zoom"
                                alt={`Copertina di ${book.title}`}
                                className="flex h-full w-full"
                                imageClassName="h-full w-full"
                                skeletonClassName="rounded-sm"
                                sizes="100vw"
                                showBadges={false}
                                loadingFallback={(
                                    <span
                                        role="status"
                                        aria-label="Caricamento copertina"
                                        className="rounded-full bg-black/60 p-3 text-white shadow-lg backdrop-blur-sm"
                                    >
                                        <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
                                    </span>
                                )}
                            />
                        </div>

                        <div className="absolute right-4 top-4 z-20 flex gap-2">
                            {isFullscreenSupported && (
                                <button
                                    type="button"
                                    className={controlClassName}
                                    onClick={toggleFullscreen}
                                    aria-label={isFullscreen
                                        ? 'Esci da schermo intero'
                                        : 'Visualizza a schermo intero'}
                                    title={isFullscreen
                                        ? 'Esci da schermo intero'
                                        : 'Schermo intero'}
                                >
                                    {isFullscreen ? (
                                        <Minimize className="h-5 w-5" aria-hidden="true" />
                                    ) : (
                                        <Fullscreen className="h-5 w-5" aria-hidden="true" />
                                    )}
                                </button>
                            )}

                            <button
                                type="button"
                                className={controlClassName}
                                onClick={() => handleOpenChange(false)}
                                aria-label="Chiudi immagine"
                                title="Chiudi"
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
