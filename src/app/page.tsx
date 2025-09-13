'use client';

import React, { useState } from 'react';
import { RootNav } from '@/components/layout/root-nav';
import { BookCollectionWrapper } from '@/components/books/book-collection-wrapper';
// import { BookCollection } from '@/components/books/book-collection';
// import { BookListCard } from '@/components/books/book-list-card';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuth } from '@/context/auth-context';
// import { Button } from '@/components/ui/button';
// import { Book as BookIcon, Headphones, Loader2 } from 'lucide-react';
// import { cn } from '@/lib/utils';
import { CopyrightFooter } from '@/components/shared/copyright-footer';
// import { useLogger } from '@/lib/logging.client';
import { PreviewsCollection } from '@/components/books/previews-collection';

export default function HomePage() {
    // const source = 'HomePage';
    const { state: { isAuthenticated, user } } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
                <section id="previews-collection" className="w-full py-12 sm:py-16">
                        <PreviewsCollection />
                </section>

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