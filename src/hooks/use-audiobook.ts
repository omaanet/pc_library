'use client';

import { useState, useEffect } from 'react';
import { AudioBook } from '@/types';

interface UseAudiobookProps {
    bookId: string | undefined;
}

export function useAudiobook({ bookId }: UseAudiobookProps) {
    const [audiobook, setAudiobook] = useState<AudioBook | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch audiobook data
    const fetchAudiobook = async () => {
        if (!bookId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/audiobooks/${bookId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    // No audiobook data yet, which is fine
                    setAudiobook(null);
                    return;
                }
                throw new Error(`Failed to fetch audiobook: ${response.statusText}`);
            }

            const { data } = await response.json();
            setAudiobook(data);
        } catch (err) {
            console.error('Error fetching audiobook:', err);
            setError('Failed to load audiobook data');
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch audiobook data when bookId changes
    useEffect(() => {
        const abortController = new AbortController();

        const fetchData = async () => {
            if (!bookId) {
                setAudiobook(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/audiobooks/${bookId}`, {
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        // No audiobook data yet, which is fine
                        setAudiobook(null);
                        return;
                    }
                    throw new Error(`Failed to fetch audiobook: ${response.statusText}`);
                }

                const { data } = await response.json();
                if (!abortController.signal.aborted) {
                    setAudiobook(data);
                }
            } catch (err) {
                if (!abortController.signal.aborted) {
                    console.error('Error fetching audiobook:', err);
                    setError('Failed to load audiobook data');
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            abortController.abort();
        };
    }, [bookId]);

    // Save audiobook data
    const saveAudiobook = async (data: {
        audio_filename?: string;
        media_id: string | null;
        audio_length: number | null;
        publishing_date: string | null;
    }) => {
        if (!bookId) return null;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/audiobooks/${bookId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Failed to save audiobook: ${response.statusText}`);
            }

            const { data: savedData } = await response.json();
            setAudiobook(savedData);
            return savedData;
        } catch (err) {
            console.error('Error saving audiobook:', err);
            setError('Failed to save audiobook data');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        audiobook,
        loading,
        error,
        fetchAudiobook,
        saveAudiobook,
    };
}
