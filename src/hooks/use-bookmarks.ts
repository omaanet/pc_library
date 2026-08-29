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

interface UseBookmarksOptions {
    authenticated?: boolean;
    allowAnonymous?: boolean;
    audioMediaId?: string | null;
}

type BookmarkStorageMode = 'authenticated' | 'anonymous' | 'disabled';

const ANONYMOUS_BOOKMARK_PREFIX = 'anonymous-bookmarks-v1';

function getAnonymousBookmarkKey(bookId: string): string {
    return `${ANONYMOUS_BOOKMARK_PREFIX}:${bookId}`;
}

function isStoredBookmark(value: unknown, kind: BookmarkKind, bookId: string): value is ClientBookmark {
    if (!value || typeof value !== 'object') return false;
    const bookmark = value as Partial<ClientBookmark>;

    return bookmark.kind === kind
        && bookmark.bookId === bookId
        && (bookmark.pageNumber === null || Number.isInteger(bookmark.pageNumber))
        && (bookmark.audioTimeSeconds === null || Number.isInteger(bookmark.audioTimeSeconds));
}

function readAnonymousBookmarks(bookId: string): ClientBookmarks {
    try {
        const serialized = window.localStorage.getItem(getAnonymousBookmarkKey(bookId));
        if (!serialized) return { reader: null, audio: null };

        const stored = JSON.parse(serialized) as Partial<ClientBookmarks>;
        return {
            reader: isStoredBookmark(stored.reader, 'reader', bookId) ? stored.reader : null,
            audio: isStoredBookmark(stored.audio, 'audio', bookId) ? stored.audio : null,
        };
    } catch {
        return { reader: null, audio: null };
    }
}

function writeAnonymousBookmarks(bookId: string, bookmarks: ClientBookmarks): void {
    window.localStorage.setItem(getAnonymousBookmarkKey(bookId), JSON.stringify(bookmarks));
}

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

export function useBookmarks(
    bookId: string | undefined,
    {
        authenticated = false,
        allowAnonymous = false,
        audioMediaId = null,
    }: UseBookmarksOptions = {}
) {
    const [bookmarks, setBookmarks] = useState<ClientBookmarks>({ reader: null, audio: null });
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [initializedKey, setInitializedKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const mode: BookmarkStorageMode = !bookId
        ? 'disabled'
        : authenticated
            ? 'authenticated'
            : allowAnonymous
                ? 'anonymous'
                : 'disabled';
    const requestKey = bookId && mode !== 'disabled' ? `${mode}:${bookId}` : null;
    const initializedForRequest = requestKey ? initialized && initializedKey === requestKey : initialized;
    const canWrite = Boolean(bookId && mode !== 'disabled' && initializedForRequest && !error);

    const fetchBookmarks = useCallback(async (signal?: AbortSignal) => {
        if (!bookId || mode === 'disabled') {
            setBookmarks({ reader: null, audio: null });
            setInitialized(true);
            setInitializedKey(null);
            return;
        }

        const currentRequestKey = `${mode}:${bookId}`;
        setLoading(true);
        setInitialized(false);
        setInitializedKey(null);
        setError(null);

        try {
            if (mode === 'anonymous') {
                setBookmarks(readAnonymousBookmarks(bookId));
                return;
            }

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
            setInitializedKey(currentRequestKey);
        }
    }, [bookId, mode]);

    useEffect(() => {
        const controller = new AbortController();
        fetchBookmarks(controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchBookmarks]);

    const saveBookmark = useCallback(async (input: SaveBookmarkInput) => {
        if (!bookId || mode === 'disabled' || !initializedForRequest || error) return null;

        if (mode === 'anonymous') {
            const current = readAnonymousBookmarks(bookId);
            const previous = current[input.kind];
            const now = new Date().toISOString();
            const bookmark: ClientBookmark = {
                id: input.kind === 'reader' ? -1 : -2,
                bookId,
                userId: 0,
                kind: input.kind,
                pageNumber: input.kind === 'reader' ? input.pageNumber : null,
                audioTimeSeconds: input.kind === 'audio' ? input.audioTimeSeconds : null,
                audioMediaId: input.kind === 'audio' ? audioMediaId : null,
                createdAt: previous?.createdAt ?? now,
                updatedAt: now,
            };
            const next = { ...current, [input.kind]: bookmark };

            try {
                writeAnonymousBookmarks(bookId, next);
                setBookmarks(next);
                return bookmark;
            } catch (caughtError) {
                setError('Unable to save bookmark in this browser');
                throw caughtError;
            }
        }

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
    }, [audioMediaId, bookId, error, initializedForRequest, mode]);

    const deleteBookmark = useCallback(async (kind: BookmarkKind) => {
        if (!bookId || mode === 'disabled' || !initializedForRequest || error) return false;

        if (mode === 'anonymous') {
            const current = readAnonymousBookmarks(bookId);
            const deleted = Boolean(current[kind]);
            const next = { ...current, [kind]: null };

            try {
                writeAnonymousBookmarks(bookId, next);
                setBookmarks(next);
                return deleted;
            } catch (caughtError) {
                setError('Unable to delete bookmark in this browser');
                throw caughtError;
            }
        }

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
    }, [bookId, error, initializedForRequest, mode]);

    return {
        bookmarks,
        loading,
        initialized: initializedForRequest,
        error,
        canWrite,
        fetchBookmarks,
        saveBookmark,
        deleteBookmark,
    };
}
