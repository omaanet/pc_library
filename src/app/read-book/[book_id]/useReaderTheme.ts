"use client";
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing page reader theme (font, size, line height) in localStorage.
 * @param bookId string
 */
export interface ReaderStyleConfig {
    theme?: 'system' | 'light' | 'dark' /*| 'sepia'*/;
    fontFamily?: string;
    fontSize?: string;
    lineHeight?: string;
}

export function useReaderTheme(bookId: string) {
    const key = `reader-style:${bookId}`;
    const [styleConfig, setStyleConfig] = useState<ReaderStyleConfig>({});

    // Load style from localStorage after mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                setStyleConfig(JSON.parse(stored) as ReaderStyleConfig);
            }
        } catch (error) {
            console.error('Error loading reader theme:', error);
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
