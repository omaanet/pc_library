'use client';

import React, { useState, useEffect } from 'react';
import { RootNav } from '@/components/layout/root-nav';
import { BookCollectionWrapper } from '@/components/books/book-collection-wrapper';
// import { BookCollection } from '@/components/books/book-collection';
// import { BookListCard } from '@/components/books/book-list-card';
import { BookCover } from '@/components/books/book-cover';
import { AuthModal } from '@/components/auth/auth-modal';
import { Book } from '@/types';
import { useAuth } from '@/context/auth-context';
// import { Button } from '@/components/ui/button';
import { Book as BookIcon, Headphones, Loader2 } from 'lucide-react';
// import { cn } from '@/lib/utils';
import { DEFAULT_COVER_SIZES } from '@/types/images';
import { CopyrightFooter } from '@/components/shared/copyright-footer';
// import { useLogger } from '@/lib/logging.client';

import dynamic from 'next/dynamic';

export default function HomePage() {
    // const source = 'HomePage';
    const { state: { isAuthenticated, user } } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const MuxPlayer = dynamic(
        () => import('@mux/mux-player-react'),
        {
            ssr: false,
            loading: () => (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )
        }
    );

    useEffect(() => {
        async function fetchPreviewBooks() {
            try {
                setLoading(true);
                const response = await fetch('/api/books?displayPreviews=1&sortOrder=desc&isVisible=1'); // expects { data, pagination }
                if (!response.ok) {
                    throw new Error(`Failed to fetch preview books: ${response.status}`);
                }

                const { books } = await response.json();

                setBooks(Array.isArray(books) ? books : []);
            } catch (error) {
                console.error('Error loading preview books:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPreviewBooks();

        // Set mounted state when component mounts
        setMounted(true);
        return () => setMounted(false);
    }, []);

    return (
        <>
            <RootNav
                isAuthenticated={isAuthenticated}
                onAuthClick={() => setIsAuthModalOpen(true)}
            />

            <main className="flex-1 mx-5 sm:mx-auto">

                {/* Hero Section */}
                <section className="relative overflow-hidden pt-12 pb-0 sm:pt-12 sm:pb-0">
                    {/* <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" /> */}
                    <div className="container mx-auto space-y-2">
                        <div className="space-y-4 text-center">
                            <h1 className="text-3xl font-medium tracking-tight md:tracking-normal sm:text-5xl text-sky-600 dark:text-sky-400">
                                Racconti in Voce e Caratteri<br />Espressioni di Scrittura Creativa
                            </h1>

                            {/*<p className="mx-auto max-w-5xl text-lg tracking-tight text-sky-400 dark:text-sky-500">
                                Una variegata raccolta narrativa di fantasia.  Novelle in libera lettura.
                            </p> */}

                            <p className="mx-auto max-w-5xl text-lg tracking-tight md:tracking-normal text-sky-500 dark:text-sky-300">
                                <span className="inline-block mt-4">Una variegata raccolta narrativa di fantasia.</span><br />
                                <span className="inline-block">Sito web dedicato alla lettura a scopo benefico.</span><br />
                                <span className="inline-block mt-4 text-emerald-600 dark:text-emerald-400">Un libero contributo da destinarsi a scelta del lettore a favore di:<br />Organizzazioni Non Profit, Associazioni di Volontariato, Fondazioni o a cause specifiche.</span>
                            </p>
                        </div>

                        {/* <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                            <div className="rounded-xl border bg-card p-6">
                                <BookIcon className="h-12 w-12 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Digital Books</h3>
                                <p className="text-muted-foreground">
                                    Access our extensive collection of digital books from any device.
                                </p>
                            </div>
                            <div className="rounded-xl border bg-card p-6">
                                <Headphones className="h-12 w-12 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Audiobooks</h3>
                                <p className="text-muted-foreground">
                                    Listen to professionally narrated audiobooks on the go.
                                </p>
                            </div>
                        </div> */}

                    </div>
                </section>

                {/* Collection Section */}
                <section id="collection" className="w-full py-12 sm:py-16">
                    <div className="w-full container">
                        <BookCollectionWrapper displayPreviews={0} />
                    </div>
                </section>

                {/* Previews Collection Section */}
                <div className="w-full grid grid-cols-1 gap-6 py-8">
                    <div className="rounded-xl border bg-card p-6">
                        <div className="flex flex-row items-center justify-center mb-8">
                            <BookIcon className="h-8 w-8 -mt-1 mx-2" />
                            <div className="text-xl font-semibold mx-2 text-center">Racconti In Anteprima</div>
                        </div>

                        <section id="previews-collection">

                            <div className="container-fluid text-center flex flex-wrap gap-4 justify-center items-start">
                                {/* <BookVideoCover videoSource="https://s3.eu-south-1.wasabisys.com/piero-audiolibri/Il Mistero del Dipinto.mp4" orientation="portrait" /> */}

                                <div
                                    className="relative flex justify-center items-center bg-muted/30 rounded-sm"
                                    style={{ height: DEFAULT_COVER_SIZES.video.height }}
                                >
                                    {mounted && (
                                        <MuxPlayer
                                            playbackId="00cc2D1BA4VPs2uNwHl01ZGGkZu9seiUHu"
                                            metadata={{
                                                video_title: 'Il Mistero del Dipinto',
                                                viewer_user_id: '1'
                                            }}
                                            style={{
                                                width: DEFAULT_COVER_SIZES.video.width,
                                                height: DEFAULT_COVER_SIZES.video.height,
                                                "--cast-button": "none"
                                            } as React.CSSProperties}
                                        />
                                    )}
                                </div>

                                {loading ? (
                                    <div className="py-4 text-muted-foreground">
                                        Caricamento anteprima libri...
                                    </div>
                                ) : (!Array.isArray(books) || books.length === 0) ? (
                                    <div className="py-4 text-muted-foreground">
                                        Al momento non sono disponibili anteprime dei libri.
                                    </div>
                                ) : (
                                    books.map((book, index) => (
                                        <BookCover key={`${book.id}-${index}`} book={book} orientation="portrait" />
                                    ))
                                )}

                                <div
                                    className="relative flex justify-center items-center bg-muted/30 rounded-sm"
                                    style={{ height: DEFAULT_COVER_SIZES.video.height }}
                                >
                                    {mounted && (
                                        <MuxPlayer
                                            playbackId="OUBwb9ttqKASxQnb8EnKnIszb301VrROQ"
                                            metadata={{
                                                video_title: 'La Ragazza del Carillon',
                                                viewer_user_id: '1'
                                            }}
                                            style={{
                                                width: DEFAULT_COVER_SIZES.video.width,
                                                height: DEFAULT_COVER_SIZES.video.height,
                                                "--cast-button": "none"
                                            } as React.CSSProperties}
                                        />
                                    )}
                                </div>

                            </div>
                        </section>

                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="w-full  border-t mt-10 py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row mx-auto">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        <CopyrightFooter lang="it" detailed />
                    </p>
                </div>
            </footer>

            {/* Auth Modal */}
            <AuthModal
                open={isAuthModalOpen}
                onOpenChange={setIsAuthModalOpen}
            />
        </>
    );
}