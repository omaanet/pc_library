'use client';

import { useState } from 'react';
import { RootNav } from '@/components/layout/root-nav';
import { BookCollectionWrapper } from '@/components/books/book-collection-wrapper';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuth } from '@/context/auth-context';
import { CopyrightFooter } from '@/components/shared/copyright-footer';
import { PreviewsCollection } from '@/components/books/previews-collection';
import { BookErrorBoundary } from '@/components/books/book-error-boundary';
import { SITE_CONFIG } from '@/config/site-config';
import { displayFontClass } from '@/config/fonts';

export default function HomePage() {
    const { state: { isAuthenticated, user } } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    return (
        <>
            <RootNav
                isAuthenticated={isAuthenticated}
                onAuthClick={() => setIsAuthModalOpen(true)}
            />

            <main className="flex-1 mx-2 sm:container sm:mx-auto">

                {/* Hero Section */}
                <section className="relative overflow-hidden pt-12 pb-0 sm:pt-12 sm:pb-0">
                    <div className="container mx-auto space-y-2">
                        <div className="space-y-1 sm:space-y-4 text-center">
                            <h1 className={`text-4xl font-medium tracking-tight md:tracking-normal sm:text-6xl text-sky-600 dark:text-sky-400 ${displayFontClass}`}>
                                Racconti in Voce e Caratteri
                            </h1>
                            <h2 className={`text-4xl font-medium tracking-tight md:tracking-normal sm:text-5xl text-sky-600 dark:text-sky-400 ${displayFontClass}`}>
                                Espressioni di Scrittura Creativa
                            </h2>

                            <p className="mx-auto max-w-5xl text-sm md:text-lg tracking-tight md:tracking-normal text-sky-500 dark:text-sky-300">
                                <span className="inline-block mt-4">Una variegata raccolta narrativa di fantasia.</span><br />
                                <span className="inline-block">Sito web dedicato alla lettura a scopo benefico.</span><br />
                                <span className="inline-block mt-4 text-emerald-600 dark:text-emerald-400">Un libero contributo da destinarsi a scelta del lettore a favore di:<br />Organizzazioni Non Profit, Associazioni di Volontariato, Fondazioni o a cause specifiche.</span>
                            </p>
                        </div>

                    </div>
                </section>

                {/* Collection Section */}
                <section id="collection" className="w-full py-12 sm:py-16">
                    <div className="w-full container-fluid sm:container">
                        <BookCollectionWrapper displayPreviews={SITE_CONFIG.DISPLAY_PREVIEWS.NON_PREVIEW_ONLY} />
                    </div>
                </section>

                {/* Previews Collection Section */}
                <section id="previews-collection" className="w-full py-12 sm:py-16">
                    <BookErrorBoundary>
                        <PreviewsCollection />
                    </BookErrorBoundary>
                </section>

            </main>

            {/* Footer */}
            <footer className="w-full border-t mt-10 py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-3 md:h-24 md:flex-row mx-auto">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        <CopyrightFooter lang="it" detailed />
                    </p>
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="AbstractProfile float-anim">
                        <g transform="translate(0 5.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" shapeRendering="geometricPrecision" vectorEffect="non-scaling-stroke">
                            {/* Abstract Profile */}
                            <path d="M30 80 Q 25 50 40 40 Q 50 35 50 20" stroke="var(--Abstract-Profile-1)"></path>
                            <g strokeWidth="2" stroke="var(--gold-main)">
                                {/* Sound waves coming from "mouth" area */}
                                <path d="M55 45 Q 65 45 75 35"></path>
                                <path d="M55 55 Q 70 55 85 40" opacity="0.6"></path>
                            </g>
                            <g transform="translate(0 -2.5)" strokeWidth="0">
                                {/* Letters floating up */}
                                <text x="32.5" y="30" fontSize="14" fill="var(--Abstract-Profile-Lb)" opacity="0.675">b</text>
                                <text x="44.5" y="17.5" fontSize="15.5" fill="var(--Abstract-Profile-LA)" opacity="0.675">A</text>
                                <text x="64.5" y="21.5" fontSize="14" fill="var(--Abstract-Profile-Lc)" opacity="0.675">c</text>
                            </g>
                        </g>
                    </svg>
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