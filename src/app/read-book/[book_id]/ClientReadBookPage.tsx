"use client";

import dynamic from 'next/dynamic';
import { BackButton } from './BackButton';
// Removed useTheme import as theme handling is now part of EPUBViewer's themeOverrides
import React, { useState } from 'react';
import type { Book } from '@/types';
import OptionsSidebar from './OptionsSidebar';
import { Settings } from 'lucide-react';
import { useReadingProgress } from './useReadingProgress';
import { useReaderTheme } from './useReaderTheme';

// --- Import the NEW EPUBViewer ---
// Ensure the path is correct based on your file structure
const EPUBViewer = dynamic(() => import('./EPUBViewer'), { ssr: false }); // Disable SSR for epub.js
// const MinimalEPUBViewer = dynamic(() => import('./MinimalEPUBViewer'), { ssr: false });

interface ClientReadBookPageProps {
    bookId: string;
    book: Book | undefined;
    // myTracks: { title: string; url: string }[];
    // hasAudio: boolean;
}

// StyleConfig is now imported from useReaderTheme

export default function ClientReadBookPage({ bookId, book /*, myTracks, hasAudio*/ }: ClientReadBookPageProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // EPUB reading progress and theme
    const { progress: epubLocation, saveProgress: saveEpubLocation } = useReadingProgress(bookId, 'epub');
    const { styleConfig, saveStyle } = useReaderTheme(bookId);

    // Map styleConfig to EPUBViewer themeOverrides
    const generateThemeOverrides = (config: typeof styleConfig) => {
        const overrides: any = { 'body': {}, 'p': {} };
        if (config.fontFamily && config.fontFamily !== '') {
            overrides['body']['font-family'] = `${config.fontFamily} !important`;
        } else {
            delete overrides['body']['font-family'];
        }
        if (config.fontSize && config.fontSize !== '') {
            overrides['body']['font-size'] = `${config.fontSize} !important`;
        } else {
            delete overrides['body']['font-size'];
        }
        if (config.lineHeight && config.lineHeight !== '') {
            overrides['p']['line-height'] = `${config.lineHeight} !important`;
        } else {
            delete overrides['p']['line-height'];
        }
        return overrides;
    };

    const epubViewerThemeOverrides = generateThemeOverrides(styleConfig);

    return (
        <div className="h-full w-full">
            {/* Settings Button - Adjusted z-index if needed */}
            <button
                className="fixed top-4 right-4 z-50 rounded-full p-2 bg-background border border-border shadow hover:bg-accent focus:outline-none focus:ring"
                aria-label="Open settings sidebar"
                onClick={() => setSidebarOpen(true)}
                type="button"
            >
                <Settings size={22} />
            </button>
            {/* Sidebar */}
            <OptionsSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                styleConfig={styleConfig}
                onStyleChange={saveStyle}
            />

            {/* Back Button */}
            <BackButton />

            {/* Main Content Area */}
            <div className="min-h-screen flex flex-col relative bg-background text-foreground">
                {/* EPUB Viewer Container */}
                {book && (
                    <div id="epub-viewer-container" className="h-screen w-full overflow-hidden">
                        <EPUBViewer
                            book={book}
                            bookId={bookId}
                            location={typeof epubLocation === 'string' ? epubLocation : undefined}
                            onLocationChange={saveEpubLocation}
                            themeOverrides={epubViewerThemeOverrides}
                        />
                    </div>
                )}
                {!book && (
                    <div className="flex items-center justify-center h-screen">
                        <p>Book data not found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}