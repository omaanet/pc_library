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
}): Promise<boolean> {
    try {
        console.log('[saveOrUpdateAudioBook] data:', data);
        const success = await saveAudioBook(data);
        if (!success) {
            console.error(`[saveOrUpdateAudioBook] Failed to save/update audiobook for book ${data.book_id}`);
            return false;
        }
        return true;
    } catch (error) {
        console.error(`[saveOrUpdateAudioBook] Error saving/updating audiobook for book ${data.book_id}:`, error);
        return false;
    }
}
