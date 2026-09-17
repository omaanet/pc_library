'use client';

import { useEffect, useMemo, useRef } from 'react';
import { track } from '@vercel/analytics';
import { createAudioTracking, createBookTracking, type SendEvent } from '@/lib/vercel-analytics/tracking';

const enabled = process.env.NEXT_PUBLIC_VERCEL_CUSTOM_EVENTS_ENABLED === 'true';
const send: SendEvent = (name, properties) => {
    if (!enabled) return;
    try { track(name, properties); } catch { /* Analytics must not interfere with navigation/playback. */ }
};
const books = createBookTracking(send, () => window.sessionStorage);

export function useBookViewTracking(bookId: string | undefined, open: boolean) {
    const viewed = useRef<string | null>(null);
    useEffect(() => {
        if (!enabled) return;
        if (!open || !bookId) { viewed.current = null; return; }
        if (viewed.current === bookId) return;
        viewed.current = bookId;
        books.view(bookId);
    }, [bookId, open]);
}
export function useReaderOpenTracking(bookId: string) {
    const opened = useRef<string | null>(null);
    return (image: HTMLImageElement) => {
        if (!enabled || opened.current === bookId || image.naturalWidth === 0 || !image.currentSrc || image.currentSrc.startsWith('data:')) return;
        opened.current = bookId;
        books.reader(bookId);
    };
}
export function useAudioAnalytics(bookId: string | undefined, sourceId: string | undefined, source: 'library' | 'promo', disabled = false) {
    return useMemo(() => createAudioTracking(disabled || !enabled || !bookId || !sourceId ? () => {} : send, bookId || '', source), [bookId, sourceId, source, disabled]);
}
