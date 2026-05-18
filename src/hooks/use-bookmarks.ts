'use client';

import { useCallback, useEffect, useState } from 'react';

export type BookmarkKind = 'reader' | 'audio';

export interface ClientBookmark {
    id: number;
    bookId: string;
    userId: number;
    kind: BookmarkKind;
    pageNumber: number | null;
    audioTimeSeconds: number | null;
    audioMediaId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ClientBookmarks {
    reader: ClientBookmark | null;
    audio: ClientBookmark | null;
}

type SaveBookmarkInput =
    | { kind: 'reader'; pageNumber: number }
    | { kind: 'audio'; audioTimeSeconds: number };

let csrfToken: string | null = null;

async function getCSRFToken(): Promise<string> {
    if (csrfToken) return csrfToken;

    const response = await fetch('/api/csrf-token');
    if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
    }

    const data = await response.json() as { token?: string };
    csrfToken = data.token ?? null;

    if (!csrfToken) {
        throw new Error('Missing CSRF token');
    }

    return csrfToken;
}

export function useBookmarks(bookId: string | undefined, enabled = true) {
    const [bookmarks, setBookmarks] = useState<ClientBookmarks>({ reader: null, audio: null });
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const canWrite = Boolean(bookId && enabled && initialized && !error);

    const fetchBookmarks = useCallback(async (signal?: AbortSignal) => {
        if (!bookId || !enabled) {
            setBookmarks({ reader: null, audio: null });
            setInitialized(true);
            return;
        }

        setLoading(true);
        setInitialized(false);
        setError(null);

        try {
            const response = await fetch(`/api/bookmarks/${bookId}`, {
                credentials: 'include',
                signal,
            });

            if (response.status === 401) {
                setBookmarks({ reader: null, audio: null });
                setError('Authentication required');
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch bookmarks: ${response.status}`);
            }

            const data = await response.json() as ClientBookmarks;
            setBookmarks({
                reader: data.reader ?? null,
                audio: data.audio ?? null,
            });
        } catch (caughtError) {
            if (caughtError instanceof Error && caughtError.name === 'AbortError') return;

            setError(caughtError instanceof Error ? caughtError.message : 'Failed to fetch bookmarks');
        } finally {
            setLoading(false);
            setInitialized(true);
        }
    }, [bookId, enabled]);

    useEffect(() => {
        const controller = new AbortController();
        fetchBookmarks(controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchBookmarks]);

    const saveBookmark = useCallback(async (input: SaveBookmarkInput) => {
        if (!bookId || !enabled || !initialized || error) return null;

        const token = await getCSRFToken();
        const response = await fetch(`/api/bookmarks/${bookId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': token,
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            if (response.status === 401) {
                setError('Authentication required');
                return null;
            }
            throw new Error(`Failed to save bookmark: ${response.status}`);
        }

        const data = await response.json() as { bookmark: ClientBookmark };
        setBookmarks((prev) => ({
            ...prev,
            [data.bookmark.kind]: data.bookmark,
        }));

        return data.bookmark;
    }, [bookId, enabled, error, initialized]);

    const deleteBookmark = useCallback(async (kind: BookmarkKind) => {
        if (!bookId || !enabled || !initialized || error) return false;

        const token = await getCSRFToken();
        const response = await fetch(`/api/bookmarks/${bookId}?kind=${kind}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'x-csrf-token': token,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                setError('Authentication required');
                return false;
            }
            throw new Error(`Failed to delete bookmark: ${response.status}`);
        }

        const data = await response.json() as { deleted: boolean };
        setBookmarks((prev) => ({
            ...prev,
            [kind]: null,
        }));

        return data.deleted;
    }, [bookId, enabled, error, initialized]);

    return {
        bookmarks,
        loading,
        initialized,
        error,
        canWrite,
        fetchBookmarks,
        saveBookmark,
        deleteBookmark,
    };
}
