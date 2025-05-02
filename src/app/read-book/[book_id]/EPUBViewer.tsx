'use client';

import { useState, useRef, useEffect } from 'react';
import { ReactReader } from 'react-reader';
// import { useRouter } from 'next/navigation';
// import { ArrowLeft } from 'lucide-react';
import { Book } from '@/types';

interface EPUBViewerProps {
    bookId: string;
    book: Book | undefined;
    location?: string;
    onLocationChange?: (location: string) => void;
    themeOverrides?: any;
}

const EPUBViewer = ({ bookId, book, location, onLocationChange, themeOverrides }: EPUBViewerProps) => {
    // const router = useRouter();
    const renditionRef = useRef<any>(null);

    // Remove local location state (now controlled)
    const [loaded, setLoaded] = useState(false);
    const [title, setTitle] = useState<string>('Il racconto sta caricando...');
    const [error, setError] = useState<string | null>(null);

    // URL to load the EPUB file from the API
    const epubUrl = `/epub/${bookId}/output.epub`;
    //const epubUrl = `/api/epub/${bookId}/`;


    // Show error if any
    if (error) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <div className="text-red-500 max-w-lg text-center">
                    <h3 className="text-xl font-semibold mb-2">Error Loading Book</h3>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const locationChanged = (epubcifi: string) => {
        if (onLocationChange) {
            onLocationChange(epubcifi);
        }
    };

    // const handleBackClick = () => {
    //     router.back();
    // };

    return (
        <>
            {/* <div className="relative h-full w-full"> */}
            {/* Navigation header */}
            {/* <button onClick={handleBackClick} className="fixed top-2 left-1 z-20">
                <ArrowLeft className="h-8 w-8 text-gray-700" />
            </button> */}

            {/* <div className="absolute top-0 left-0 z-20 w-full bg-white/90 p-2 shadow-sm flex items-center dark:bg-zinc-800 dark:text-zinc-200">
                <Button variant="ghost" size="icon" onClick={handleBackClick} className="mr-2">
                    <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-zinc-400" />
                </Button>
                <h1 className="text-lg font-medium text-gray-700 dark:text-zinc-200 truncate">{title || 'Il racconto sta caricando...'}</h1>
            </div> */}

            {/* Reader component with top padding for the header */}
            {/* pt-[52px]  */}
            {/* <div className="h-full w-full">
                <div className="h-full w-full relative"> */}
            <ReactReader
                url={epubUrl}
                location={location ?? null}
                locationChanged={locationChanged}
                getRendition={(rendition) => {
                    renditionRef.current = rendition;

                    // Add error handling
                    rendition.on('error', (err: any) => {
                        console.error('EPUB render error:', err);
                        setError('Failed to load the book. The file may be corrupted or in an unsupported format.');
                    });

                    // Get book metadata
                    rendition.book.loaded.metadata.then((metadata: any) => {
                        // console.log('Metadata loaded:', metadata);
                        if (metadata.title) {
                            setTitle(metadata.title);
                        }
                    }).catch((err: any) => {
                        console.error('Error loading metadata:', err);
                    });

                    rendition.themes.register('custom', themeOverrides || {
                        'body': {
                            'font-family': `Arial, sans-serif !important`,
                            'font-size': '1.1rem !important',
                            'line-height': '1.5 !important',
                            'padding': '0 20px !important',
                        },
                        'p': {
                            'margin': '1em 0 !important'
                        }
                    });
                    // rendition.themes.select('custom');
                    // Handle onReady here instead of using an unsupported prop
                    setLoaded(true);
                }}
                showToc={false}
                epubOptions={{
                    allowPopups: true, // Adds `allow-popups` to sandbox-attribute
                    allowScriptedContent: true, // Adds `allow-scripts` to sandbox-attribute
                    flow: 'paginated',
                    manager: 'continuous',
                    snap: true,
                }}
                swipeable
                loadingView={<div className="flex items-center justify-center h-full"></div>}
                tocChanged={(toc) => {
                    if (toc.length > 0 && toc[0].label) {
                        setTitle(toc[0].label);
                    }
                }}
                epubInitOptions={{
                    openAs: 'epub',
                }}
            />
            {/* </div>
            </div> */}
            {/* </div> */}
        </>
    );
};

export default EPUBViewer;
