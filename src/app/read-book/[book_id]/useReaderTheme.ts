"use client";
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing EPUB reader theme (font, size, line height) in localStorage.
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
    // Initialize styleConfig synchronously from localStorage (client-only)
    const [styleConfig, setStyleConfig] = useState<ReaderStyleConfig>(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) as ReaderStyleConfig : {};
        } catch {
            return {};
        }
    });

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
