"use client";
import dynamic from 'next/dynamic';
import HTML5Player from '@/components/HTML5Player';
import { BackButton } from './BackButton';
import { useTheme } from 'next-themes';
import * as React from 'react';
import type { Book } from '@/types';

const EPUBViewer = dynamic(() => import('./EPUBViewer').then(mod => mod.default));

interface ClientReadBookPageProps {
    bookId: string;
    book?: Book;
    myTracks: { title: string; url: string }[];
    hasAudio: boolean;
}

import OptionsSidebar from './OptionsSidebar';

import { Settings } from 'lucide-react';

export default function ClientReadBookPage({ bookId, book, myTracks, hasAudio }: ClientReadBookPageProps) {
    const { theme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [styleConfig, setStyleConfig] = React.useState({});

    return (
        <div className="h-full w-full">
            {/* Fixed settings button */}
            <button
                className="fixed top-4 right-4 z-50 rounded-full p-2 bg-background border border-border shadow hover:bg-accent focus:outline-none focus:ring"
                aria-label="Open settings sidebar"
                onClick={() => setSidebarOpen(true)}
                type="button"
            >
                <Settings size={22} />
            </button>
            <OptionsSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                styleConfig={styleConfig}
                onStyleChange={setStyleConfig}
            />

            <BackButton />
            <div className="min-h-screen flex flex-col relative bg-background text-foreground">
                {hasAudio && (
                    <div className="absolute top-0 left-0 right-0 z-20 w-full text-center p-0 rounded-md my-2 mx-auto max-w-lg">
                        <HTML5Player tracks={myTracks} autoPlay={false} />
                    </div>
                )}
                {book && (
                    <div className={`${hasAudio ? 'pt-[90px]' : ''} h-screen w-full overflow-hidden`}>
                        <EPUBViewer bookId={bookId} book={book} />
                    </div>
                )}
            </div>
        </div>
    );
}

