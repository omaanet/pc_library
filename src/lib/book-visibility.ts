import type { Book } from '@/types';

type BookVisibility = Pick<Book, 'hasAudio' | 'isReadingVisible' | 'isAudioVisible'>;

type VisibilityPayload = {
    hasAudio?: unknown;
    isVisible?: unknown;
    isReadingVisible?: unknown;
    isAudioVisible?: unknown;
};

type VisibilityDefaults = {
    isReadingVisible: boolean;
    isAudioVisible: boolean;
};

export type MasterVisibilityState = boolean | 'indeterminate';
export type BookPresentationMode =
    | 'reading-only'
    | 'audio-only'
    | 'reading-and-audio'
    | 'unavailable';

export function isReadingAvailable(book: BookVisibility): boolean {
    return book.isReadingVisible;
}

export function isAudioAvailable(book: BookVisibility): boolean {
    return book.hasAudio && book.isAudioVisible;
}

export function isBookAvailable(book: BookVisibility): boolean {
    return isReadingAvailable(book) || isAudioAvailable(book);
}

export function getBookPresentationMode(book: BookVisibility): BookPresentationMode {
    const hasReading = isReadingAvailable(book);
    const hasAudio = isAudioAvailable(book);

    if (hasReading && hasAudio) return 'reading-and-audio';
    if (hasReading) return 'reading-only';
    if (hasAudio) return 'audio-only';
    return 'unavailable';
}

export function canAccessReading(book: BookVisibility, isAdmin = false): boolean {
    return isAdmin || isReadingAvailable(book);
}

export function canAccessAudio(book: BookVisibility, isAdmin = false): boolean {
    return isAdmin || isAudioAvailable(book);
}

export function canAccessBook(book: BookVisibility, isAdmin = false): boolean {
    return isAdmin || isBookAvailable(book);
}

export function getMasterVisibilityState(book: BookVisibility): MasterVisibilityState {
    const allVisible = book.isReadingVisible && (!book.hasAudio || book.isAudioVisible);
    const noneVisible = !book.isReadingVisible && (!book.hasAudio || !book.isAudioVisible);

    if (allVisible) return true;
    if (noneVisible) return false;
    return 'indeterminate';
}

export function getBulkVisibilityUpdate(book: BookVisibility): VisibilityDefaults {
    const nextVisible = getMasterVisibilityState(book) !== true;
    return {
        isReadingVisible: nextVisible,
        isAudioVisible: book.hasAudio ? nextVisible : false,
    };
}

function legacyVisibility(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    return undefined;
}

export function normalizeBookVisibility(
    payload: VisibilityPayload,
    defaults: VisibilityDefaults
): VisibilityDefaults {
    const legacy = legacyVisibility(payload.isVisible);
    const isReadingVisible = typeof payload.isReadingVisible === 'boolean'
        ? payload.isReadingVisible
        : legacy ?? defaults.isReadingVisible;
    const requestedAudioVisibility = typeof payload.isAudioVisible === 'boolean'
        ? payload.isAudioVisible
        : legacy ?? defaults.isAudioVisible;

    return {
        isReadingVisible,
        isAudioVisible: payload.hasAudio === false ? false : requestedAudioVisibility,
    };
}
