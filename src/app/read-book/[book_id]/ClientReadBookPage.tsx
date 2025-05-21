"use client";

import React, { useState } from 'react';
import type { Book } from '@/types';
import { BackButton } from './BackButton';
import { useAuth } from '@/context/auth-context';
import dynamic from 'next/dynamic';
// import { AuthModal } from '@/components/auth/auth-modal';

interface ClientReadBookPageProps {
    bookId: string;
    book: Book | undefined;
}

// Dynamically import PageReader to avoid SSR issues with DOM manipulation
const PageReader = dynamic(() => import('./PageReader'), { ssr: false });

export default function ClientReadBookPage({ bookId, book }: ClientReadBookPageProps) {
    const { state } = useAuth();
    const { user, isLoading } = state;

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <>
                {/* <div className="flex items-center justify-center h-screen">
                    <div className="text-center font-light text-xl text-gray-300">Caricamento...</div>
                </div> */}
            </>
        );
    }

    // After loading is complete, check if user is authenticated
    if (!user || !user.id) {
        return (
            <>
                {/* <div className="flex items-center justify-center h-screen">
                    <div className="text-center font-light text-2xl text-gray-300">
                        Reindirizzamento alla pagina di login...
                    </div>
                </div> */}
            </>
        );
    }

    return (
        <div className="h-full w-full">
            {/* Back Button */}
            <BackButton />

            {/* Main Content Area */}
            <div className="min-h-screen flex flex-col relative bg-background text-foreground">
                {!book ? (
                    <div className="flex items-center justify-center h-screen">
                        <p>Racconto non trovato.</p>
                    </div>
                ) : (
                    <>
                        <PageReader book={book} bookId={bookId} user={user} />
                    </>
                )}
            </div>
        </div>
    );
}