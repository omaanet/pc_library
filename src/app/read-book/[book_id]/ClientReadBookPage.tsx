"use client";

import React from 'react';
import type { Book } from '@/types';
import { BackButton } from './BackButton';
import dynamic from 'next/dynamic';

interface ClientReadBookPageProps {
    bookId: string;
    book: Book | undefined;
}

// Dynamically import PageReader to avoid SSR issues with DOM manipulation
const PageReader = dynamic(() => import('./PageReader'), { ssr: false });

export default function ClientReadBookPage({ bookId, book }: ClientReadBookPageProps) {
    "use client";
    
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
                    <PageReader book={book} bookId={bookId} />
                )}
            </div>
        </div>
    );
}