import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing audio reading progress (timestamp) in localStorage.
 * @param bookId string
 */
export function useReadingProgress(bookId: string) {
    const key = `read-progress:${bookId}:audio`;
    const [progress, setProgress] = useState<number | undefined>(undefined);

    // Load progress from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(key);
        if (stored) {
            setProgress(Number(stored));
        }
    }, [key]);

    // Save progress to localStorage
    const saveProgress = useCallback(
        (value: number) => {
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
