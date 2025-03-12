/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/page.tsx
'use client';

import * as React from 'react';
import { RootNav } from '@/components/layout/root-nav';
import { BookCollectionWrapper } from '@/components/books/book-collection-wrapper';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Book, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
    const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
    const { state: { isAuthenticated, user } } = useAuth();

    return (
        <>
            <RootNav
                isAuthenticated={isAuthenticated}
                onAuthClick={() => setIsAuthModalOpen(true)}
            />

            <main className="flex-1 mx-auto">

                {/* Hero Section */}
                <section className="relative overflow-hidden py-24 sm:pt-24 sm:pb-12">
                    <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
                    <div className="container space-y-8">
                        <div className="space-y-6 text-center">
                            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                                Your Digital Library
                            </h1>
                            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                                Scopri un mondo di libri e audiolibri. Leggi o ascolta ovunque, in ogni momento.
                            </p>
                            {/* <div className="flex justify-center gap-4">
                                {!isAuthenticated && (
                                    <Button
                                        size="lg"
                                        onClick={() => setIsAuthModalOpen(true)}
                                    >
                                        Get Started
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    Browse Collection
                                </Button>
                            </div> */}
                        </div>

                        {/* Feature Cards */}
                        <div className="grid grid-cols-1 gap-6 pt-8">
                            <div className="rounded-xl border bg-card p-6">
                                <Book className="h-12 w-12 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2 text-center">Anteprima</h3>

                                {/* Previews Collection Section */}
                                <section id="previews-collection" className="py-12 sm:py-16">
                                    <div className="container">
                                        <BookCollectionWrapper displayPreviews={1} />
                                    </div>
                                </section>

                            </div>
                        </div>

                        {/* <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-xl border bg-card p-6">
                                <Book className="h-12 w-12 mb-4" />
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
                            <div className="rounded-xl border bg-card p-6 sm:col-span-2 lg:col-span-1">
                                <svg
                                    className="h-12 w-12 mb-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                </svg>
                                <h3 className="text-xl font-semibold mb-2">Secure Access</h3>
                                <p className="text-muted-foreground">
                                    Your reading progress and preferences are safely stored and synced.
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
            </main>

            {/* Footer */}
            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Built with{' '}
                        <a
                            href="https://nextjs.org"
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium underline underline-offset-4"
                        >
                            Next.js
                        </a>
                        . The source code is available on{' '}
                        <a
                            href="https://github.com/yourusername/digital-library"
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium underline underline-offset-4"
                        >
                            GitHub
                        </a>
                        .
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