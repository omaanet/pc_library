import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing reading progress (location for EPUB, timestamp for audio) in localStorage.
 * @param bookId string
 * @param format 'epub' | 'audio'
 */
export function useReadingProgress(bookId: string, format: 'epub' | 'audio') {
    const key = `read-progress:${bookId}:${format}`;
    const [progress, setProgress] = useState<string | number | undefined>(undefined);

    // Load progress from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(key);
        if (stored) {
            setProgress(format === 'audio' ? Number(stored) : stored);
        }
    }, [key, format]);

    // Save progress to localStorage
    const saveProgress = useCallback(
        (value: string | number) => {
            setProgress(value);
            localStorage.setItem(key, String(value));
        },
        [key]
    );

    // Reset progress
    const resetProgress = useCallback(() => {
        setProgress(undefined);
        localStorage.removeItem(key);
    }, [key]);

    return { progress, saveProgress, resetProgress };
}
