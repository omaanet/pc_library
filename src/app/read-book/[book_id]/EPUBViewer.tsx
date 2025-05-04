'use client';

import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import { Book } from '@/types';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Rendition } from 'epubjs';

interface EPUBViewerProps {
    bookId: string;
    book: Book | undefined;
    readingFontSize?: number;
    theme?: 'system' | 'light' | 'dark' /*| 'sepia'*/;
}

// Using CSSProperties for type safety
interface ThemeConfig {
    arrowColor: string;
    background: string;
    text: string;
    readerStyles: any;
    bodyStyles: CSSProperties;
}

const EPUBViewer = ({ bookId, book, readingFontSize, theme: externalTheme }: EPUBViewerProps) => {
    type ThemeName = 'light' | 'dark' /*| 'sepia'*/;

    // Core states
    const [theme, setTheme] = useState<ThemeName>('light');
    const [location, setLocation] = useState<string | null>(null);
    const [customArrowColor, setCustomArrowColor] = useState<string>('teal');
    const [title, setTitle] = useState<string>('Il racconto sta caricando...');
    const [error, setError] = useState<string | null>(null);
    const [fontFamily, setFontFamily] = useState<string>('');

    // Navigation boundary states
    const [isFirstPage, setIsFirstPage] = useState<boolean>(true);
    const [isLastPage, setIsLastPage] = useState<boolean>(false);

    // Refs
    const renditionRef = useRef<Rendition | null>(null);
    const locationRef = useRef<string | null>(location);
    const currentThemeRef = useRef<ThemeName>(theme);
    const initialLoadRef = useRef<boolean>(true);

    // URL to load the EPUB file
    const epubUrl = `/epub/${bookId}/output.epub`;

    // Centralized theme configuration
    const themes: Record<ThemeName, ThemeConfig> = {
        light: {
            arrowColor: 'teal',
            background: '#fff',
            text: '#000',
            readerStyles: {
                ...ReactReaderStyle,
                arrow: { ...ReactReaderStyle.arrow, display: 'none' },
                readerArea: { ...ReactReaderStyle.readerArea, backgroundColor: '#fff' },
                titleArea: { ...ReactReaderStyle.titleArea, color: '#222' }
            },
            bodyStyles: {
                color: '#000',
                background: '#fff',
                transition: 'background-color 0.3s ease, color 0.3s ease'
            }
        },
        dark: {
            arrowColor: '#00ffff',
            background: '#222',
            text: '#fff',
            readerStyles: {
                ...ReactReaderStyle,
                arrow: { ...ReactReaderStyle.arrow, display: 'none' },
                readerArea: { ...ReactReaderStyle.readerArea, backgroundColor: '#222' },
                titleArea: { ...ReactReaderStyle.titleArea, color: '#fff' }
            },
            bodyStyles: {
                color: '#fff',
                background: '#222',
                transition: 'background-color 0.3s ease, color 0.3s ease'
            }
        },
        // sepia: {
        //     arrowColor: '#8b5a2b',
        //     background: '#f4ecd8',
        //     text: '#5b4636',
        //     readerStyles: {
        //         ...ReactReaderStyle,
        //         arrow: { ...ReactReaderStyle.arrow, display: 'none' },
        //         readerArea: { ...ReactReaderStyle.readerArea, backgroundColor: '#f4ecd8' },
        //         titleArea: { ...ReactReaderStyle.titleArea, color: '#5b4636' }
        //     },
        //     bodyStyles: {
        //         color: '#5b4636',
        //         background: '#f4ecd8',
        //         transition: 'background-color 0.3s ease, color 0.3s ease'
        //     }
        // }
    };

    // Update refs when their corresponding states change
    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    useEffect(() => {
        currentThemeRef.current = theme;
    }, [theme]);

    // Update rendition font size immediately on prop change
    useEffect(() => {
        if (readingFontSize != null && renditionRef.current) {
            renditionRef.current.themes.fontSize(`${readingFontSize}%`);
        }
    }, [readingFontSize]);

    // Apply external theme selection, with system fallback
    useEffect(() => {
        if (!externalTheme) return;
        let applied: ThemeName = externalTheme as ThemeName;
        if (externalTheme === 'system') {
            const darkPref = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applied = darkPref ? 'dark' : 'light';
        }
        if (applied !== theme) {
            changeTheme(applied);
        }
    }, [externalTheme]);

    // Check page boundaries using the built-in atStart and atEnd properties
    const checkBoundaries = () => {
        if (!renditionRef.current) return;

        try {
            const location = renditionRef.current.location;
            if (location) {
                setIsFirstPage(location.atStart);
                setIsLastPage(location.atEnd);
            }
        } catch (err) {
            console.error('Error checking page boundaries:', err);
        }
    };

    // Error display component
    if (error) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <div className="text-red-500 max-w-lg text-center">
                    <h3 className="text-xl font-semibold mb-2">Errore Caricamento Racconto</h3>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Riprova
                    </button>
                </div>
            </div>
        );
    }

    const locationChanged = (epubcifi: string) => {
        // if (onLocationChange) {
        //     onLocationChange(epubcifi);
        // } else {
        setLocation(epubcifi);
        // }

        // Check boundaries after location change
        setTimeout(checkBoundaries, 50);
    };

    // Apply theme function for controlling image filters, disabling transitions on initial load
    const applyTheme = (rendition: Rendition, themeName: ThemeName) => {
        if (!rendition) return;

        try {
            const contents: any = rendition.getContents();

            if (contents && contents.length > 0) {
                contents.forEach((content: any) => {
                    if (content?.document?.body) {
                        const document = content.document;
                        const body = document.body;
                        const themeData = themes[themeName];

                        // Optionally disable transitions on first load
                        const originalTransition = body.style.transition;
                        if (initialLoadRef.current) {
                            body.style.transition = 'none';
                        }
                        // Apply styles directly to body
                        Object.assign(body.style, {
                            backgroundColor: themeData.background,
                            color: themeData.text,
                            // filter: themeData.bodyStyles.filter
                        });
                        // Restore transition after applying initial
                        if (initialLoadRef.current) {
                            setTimeout(() => {
                                body.style.transition = originalTransition;
                            }, 0);
                            initialLoadRef.current = false;
                        }

                        // Handle image filters
                        /*
                        const images = document.querySelectorAll('img, svg');
                        images.forEach((img: HTMLElement) => {
                            img.style.filter = themeName === 'dark' ? 'invert(1)' : 'none';
                        });
                        */

                        // Add a class to the body for CSS specificity
                        body.classList.remove('theme-light', 'theme-dark' /*, 'theme-sepia'*/);
                        body.classList.add(`theme-${themeName}`);
                    }
                });
            }

            // Use the built-in themes API
            rendition.themes.select(themeName);
        } catch (err) {
            console.error('Error applying theme:', err);
        }
    };

    // Function to handle rendition when it's available
    const handleRendition = (rendition: Rendition): void => {
        renditionRef.current = rendition;

        // Register theme styles
        rendition.themes.register('light', {
            body: themes.light.bodyStyles as CSSProperties,
            // 'img, svg': {
            //     filter: 'none'
            // } as CSSProperties
        });

        rendition.themes.register('dark', {
            body: themes.dark.bodyStyles as CSSProperties,
            // 'img, svg': {
            //     filter: 'invert(1)'
            // } as CSSProperties
        });

        // rendition.themes.register('sepia', {
        //     body: themes.sepia.bodyStyles as CSSProperties,
        //     'img, svg': {
        //         filter: 'none'
        //     } as CSSProperties
        // });

        // Apply the current theme
        applyTheme(rendition, theme);

        // Apply initial reading font size
        if (readingFontSize != null) {
            rendition.themes.fontSize(`${readingFontSize}%`);
        }
        changeFontFamily(fontFamily);

        // Set up listeners for boundary detection
        rendition.on('relocated', () => {
            // Re-apply theme to ensure consistency
            applyTheme(rendition, currentThemeRef.current);

            // Check if we're at boundaries
            checkBoundaries();
        });

        // Initial boundary check
        setTimeout(checkBoundaries, 100);
    };

    // Theme switching function
    const changeTheme = (newTheme: ThemeName) => {
        // Update arrow color
        setCustomArrowColor(themes[newTheme].arrowColor);

        // Update theme state
        setTheme(newTheme);

        // Apply theme to rendition
        if (renditionRef.current) {
            applyTheme(renditionRef.current, newTheme);
        }
    };

    // Function to change font size directly on rendition (no state)
    const changeFontSize = (size: number) => {
        if (renditionRef.current) {
            renditionRef.current.themes.fontSize(`${size}%`);
        }
    };

    // Function to change font family
    const changeFontFamily = (family: string) => {
        setFontFamily(family);
        if (renditionRef.current) {
            renditionRef.current.themes.override('body', { fontFamily: family } as any);
        }
    };

    // Navigation functions
    const goToPrevious = () => {
        if (renditionRef.current && !isFirstPage) {
            renditionRef.current.prev();
        }
    };

    const goToNext = () => {
        if (renditionRef.current && !isLastPage) {
            renditionRef.current.next();
        }
    };

    return (
        <div className="h-full w-full">
            {/* Left navigation arrow - hidden on first page */}
            {!isFirstPage && (
                <button
                    className="absolute top-1/2 left-4 z-[1000] text-2xl bg-transparent border-none cursor-pointer transform -translate-y-1/2 hover:opacity-70 transition-opacity"
                    style={{ color: customArrowColor }}
                    onClick={goToPrevious}
                    aria-label="Pagina precedente"
                >
                    <ChevronLeft className="h-14 w-14" />
                </button>
            )}

            {/* Right navigation arrow - hidden on last page */}
            {!isLastPage && (
                <button
                    className="absolute top-1/2 right-4 z-[1000] text-2xl bg-transparent border-none cursor-pointer transform -translate-y-1/2 hover:opacity-70 transition-opacity"
                    style={{ color: customArrowColor }}
                    onClick={goToNext}
                    aria-label="Pagina successiva"
                >
                    <ChevronRight className="h-14 w-14" />
                </button>
            )}

            <ReactReader
                url={epubUrl}
                location={location}
                locationChanged={locationChanged}
                getRendition={handleRendition}
                readerStyles={themes[theme].readerStyles}
                showToc={false}
                epubOptions={{
                    allowPopups: true,
                    allowScriptedContent: true,
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
        </div>
    );
};

export default EPUBViewer;