import { AudioBook } from '@/types';
import { getAudioBookById, saveAudioBook } from '@/lib/db';

// Audiobook service functions using centralized db logic

export async function fetchAudioBook(bookId: string): Promise<AudioBook | undefined> {
    return await getAudioBookById(bookId);
}

export async function saveOrUpdateAudioBook(data: {
    book_id: string;
    media_id: string | null;
    audio_length: number | null;
    publishing_date: string | null;
}): Promise<AudioBook | undefined> {
    return await saveAudioBook(data);
}
