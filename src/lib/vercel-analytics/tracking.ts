import { romeDate } from './dates';

type EventName = 'book_view' | 'reader_open' | 'book_reader_conversion' | 'audio_start' | 'audio_complete';
export type SendEvent = (name: EventName, properties: Record<string, string>) => void;
type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const ATTRIBUTION_KEY = 'vercel-book-attribution-v1';
interface Attribution { bookId: string; at: number; viewDate: string }

export function createBookTracking(send: SendEvent, storage: StorageAccess, now = Date.now) {
    // Keep only the latest detail view for each book in this browser tab.
    const read = (): Attribution[] => {
        try {
            const items: unknown = JSON.parse(storage().getItem(ATTRIBUTION_KEY) || '[]');
            return Array.isArray(items) ? items.filter((item): item is Attribution => item && typeof item.bookId === 'string' && typeof item.at === 'number' && typeof item.viewDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.viewDate) && now() >= item.at && now() - item.at <= 1_800_000) : [];
        } catch { return []; }
    };
    const write = (items: Attribution[]) => { try { storage().setItem(ATTRIBUTION_KEY, JSON.stringify(items.slice(-50))); } catch { /* Analytics never blocks the UI. */ } };
    const safeSend: SendEvent = (name, props) => { try { send(name, props); } catch { /* Best effort. */ } };
    return {
        view(bookId: string) {
            const viewDate = romeDate(new Date(now()));
            safeSend('book_view', { bookId, viewDate });
            write([...read().filter(item => item.bookId !== bookId), { bookId, at: now(), viewDate }]);
        },
        reader(bookId: string) {
            safeSend('reader_open', { bookId });
            const items = read();
            const attribution = items.find(item => item.bookId === bookId);
            // Consume before sending so image callbacks cannot reuse this attribution.
            write(items.filter(item => item.bookId !== bookId));
            if (attribution) safeSend('book_reader_conversion', { bookId, viewDate: attribution.viewDate });
        },
    };
}

export function uniquePlayedSeconds(ranges: Pick<TimeRanges, 'length' | 'start' | 'end'>, duration: number): number {
    if (!Number.isFinite(duration) || duration <= 0) return 0;
    const intervals: [number, number][] = [];
    for (let index = 0; index < ranges.length; index++) {
        const start = Math.max(0, ranges.start(index));
        const end = Math.min(duration, ranges.end(index));
        if (Number.isFinite(start) && Number.isFinite(end) && end > start) intervals.push([start, end]);
    }
    intervals.sort((a, b) => a[0] - b[0]);
    let seconds = 0; let end = 0;
    for (const [start, nextEnd] of intervals) { seconds += Math.max(0, nextEnd - Math.max(end, start)); end = Math.max(end, nextEnd); }
    return seconds;
}
export function createAudioTracking(send: SendEvent, bookId: string, source: 'library' | 'promo') {
    let started = false; let completed = false;
    const safeSend: SendEvent = (event, props) => { try { send(event, props); } catch { /* Best effort. */ } };
    return {
        start(kind?: string) {
            if (kind !== 'main' || started) return;
            started = true; safeSend('audio_start', { bookId, source });
        },
        coverage(kind: string | undefined, seconds: number, duration: number) {
            if (kind !== 'main' || !started || completed || !Number.isFinite(duration) || duration <= 0 || seconds < duration * 0.5) return;
            completed = true; safeSend('audio_complete', { bookId, source });
        },
    };
}
