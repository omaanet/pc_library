"use client";

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import type { Book } from '@/types';
import { BackButton } from './BackButton';
import OptionsSidebar from './OptionsSidebar';
import { Settings } from 'lucide-react';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useTheme } from 'next-themes'; // for resolvedTheme in sidebar

interface ClientReadBookPageProps {
    bookId: string;
    book: Book | undefined;
}

export default function ClientReadBookPage({ bookId, book }: ClientReadBookPageProps) {
    "use client";
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Global user preferences
    const { preferences, updatePreference } = useUserPreferences();

    return (
        <div className="h-full w-full">
            {/* Settings Button - Adjusted z-index if needed */}
            <button
                className="fixed top-4 right-4 z-20 rounded-full p-2 bg-background border border-border shadow hover:bg-accent focus:outline-none focus:ring"
                aria-label="Open settings sidebar"
                onClick={() => setSidebarOpen(true)}
                type="button"
            >
                <Settings size={22} />
            </button>

            {/* Sidebar */}
            <OptionsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Back Button */}
            <BackButton />

            {/* Main Content Area */}
            <div className="min-h-screen flex flex-col relative bg-background text-foreground">
                {/* EPUB Viewer Container */}
                {!book ? (
                    <div className="flex items-center justify-center h-screen">
                        <p>Book data not found.</p>
                    </div>
                ) : (
                    <div id="epub-viewer-container" className="h-screen w-full">
                        <EPUBViewer
                            book={book}
                            bookId={bookId}
                            readingFontSize={preferences.reading.fontSize}
                            theme={preferences.theme}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

interface EPUBViewerProps {
    book: Book;
    bookId: string;
    readingFontSize: number;
    theme: string; 
}

const EPUBViewer = dynamic(() => import('./EPUBViewer'), { ssr: false }); 