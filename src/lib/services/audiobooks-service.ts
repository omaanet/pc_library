import { AudioBook } from '@/types';
import { getAudioBookById, saveAudioBook } from '@/lib/db';

// Audiobook service functions using centralized db logic

export function fetchAudioBook(bookId: string): AudioBook | undefined {
    return getAudioBookById(bookId);
}

export function saveOrUpdateAudioBook(data: {
    book_id: string;
    media_id: string | null;
    audio_length: number | null;
    publishing_date: string | null;
}): AudioBook | undefined {
    return saveAudioBook(data);
}
