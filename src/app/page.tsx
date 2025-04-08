/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/page.tsx
'use client';

import * as React from 'react';
import { RootNav } from '@/components/layout/root-nav';
import { BookCollectionWrapper } from '@/components/books/book-collection-wrapper';
import { BookCollection } from '@/components/books/book-collection';
import { BookListCard } from '@/components/books/book-list-card';
import { BookCover } from '@/components/books/book-cover';
import { AuthModal } from '@/components/auth/auth-modal';
import { Book } from '@/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Book as BookIcon, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { BookVideoCover } from '@/components/books/book-video-cover';
import MuxPlayer from '@mux/mux-player-react';
import { DEFAULT_COVER_SIZES } from '@/types/images';

export default function HomePage() {
    const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
    const { state: { isAuthenticated, user } } = useAuth();
    const [books, setBooks] = React.useState<Book[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchPreviewBooks() {
            try {
                setLoading(true);
                const response = await fetch('/api/books?displayPreviews=1');

                if (!response.ok) {
                    throw new Error(`Failed to fetch preview books: ${response.status}`);
                }

                const data = await response.json();
                setBooks(data.books);
            } catch (error) {
                console.error('Error loading preview books:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPreviewBooks();
    }, []);

    return (
        <>
            <RootNav
                isAuthenticated={isAuthenticated}
                onAuthClick={() => setIsAuthModalOpen(true)}
            />

            <main className="flex-1 mx-auto">

                {/* Hero Section */}
                <section className="relative overflow-hidden pt-12 pb-0 sm:pt-12 sm:pb-0">
                    <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
                    <div className="container space-y-2">
                        <div className="space-y-6 text-center">
                            <h1 className="text-3xl font-medium tracking-tight sm:text-5xl">
                                Racconti in Voce e Caratteri<br />Espressioni di Scrittura Creativa
                            </h1>
                            <p className="mx-auto max-w-5xl text-lg text-muted-foreground">
                                Sito web dedicato alla lettura a scopo benefico
                            </p>
                            <p className="mx-auto max-w-5xl text-lg text-muted-foreground">
                                Da Suor Turchese al Segreto dell’ottico, Piero Carbonetti presenta: Racconti in Voce e Caratteri.<br />
                                Una variegata raccolta narrativa di fantasia. Novelle in libera lettura a scopo benefico.
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
                <section id="collection" className="py-12 sm:py-16">
                    <div className="container">
                        <BookCollectionWrapper displayPreviews={0} />
                    </div>
                </section>

                {/* Previews Collection Section */}
                <div className="grid grid-cols-1 gap-6 py-8">
                    <div className="rounded-xl border bg-card p-6">
                        <div className="flex flex-row items-center justify-center mb-8">
                            <BookIcon className="h-10 w-10 mx-2" />
                            <div className="text-xl font-semibold mx-2 text-center">Libri In Anteprima</div>
                        </div>

                        <section id="previews-collection">

                            <div className="container-fluid text-center flex flex-wrap gap-4 justify-center items-start">
                                {/* <BookVideoCover videoSource="https://s3.eu-south-1.wasabisys.com/piero-audiolibri/Il Mistero del Dipinto.mp4" orientation="portrait" /> */}

                                <div
                                    className="relative flex justify-center items-center bg-muted/30 rounded-sm"
                                    style={{ height: DEFAULT_COVER_SIZES.video.height }}
                                >
                                    {typeof window !== 'undefined' && (
                                        <></>
                                        // <MuxPlayer
                                        //     playbackId="00cc2D1BA4VPs2uNwHl01ZGGkZu9seiUHu"
                                        //     metadata={{
                                        //         video_title: 'Il Mistero del Dipinto',
                                        //         viewer_user_id: '1',
                                        //     }}
                                        //     style={{ width: DEFAULT_COVER_SIZES.video.width, height: DEFAULT_COVER_SIZES.video.height, "--cast-button": "none" } as React.CSSProperties}
                                        // />
                                    )}
                                </div>

                                {loading ? (
                                    <div className="py-4 text-muted-foreground">
                                        Caricamento anteprima libri...
                                    </div>
                                ) : books.length === 0 ? (
                                    <div className="py-4 text-muted-foreground">
                                        Al momento non sono disponibili anteprime dei libri.
                                    </div>
                                ) : (
                                    books.map((book, index) => (
                                        <BookCover key={`${book.id}-${index}`} book={book} orientation="portrait"/>
                                    ))
                                )}
                            </div>
                        </section>

                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="border-t mt-10 py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row mx-auto">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        &copy; {new Date().getFullYear()} OMAA.net - All rights reserved.
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