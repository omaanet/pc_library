import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing EPUB reader theme (font, size, line height) in localStorage.
 * @param bookId string
 */
export interface ReaderStyleConfig {
    fontFamily?: string;
    fontSize?: string;
    lineHeight?: string;
}

export function useReaderTheme(bookId: string) {
    const key = `reader-style:${bookId}`;
    const [styleConfig, setStyleConfig] = useState<ReaderStyleConfig>({});

    // Load style from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                setStyleConfig(JSON.parse(stored));
            } catch (e) {
                setStyleConfig({});
            }
        }
    }, [key]);

    // Save style to localStorage
    const saveStyle = useCallback((newConfig: ReaderStyleConfig) => {
        setStyleConfig(newConfig);
        localStorage.setItem(key, JSON.stringify(newConfig));
    }, [key]);

    // Reset style
    const resetStyle = useCallback(() => {
        setStyleConfig({});
        localStorage.removeItem(key);
    }, [key]);

    return { styleConfig, saveStyle, resetStyle };
}
