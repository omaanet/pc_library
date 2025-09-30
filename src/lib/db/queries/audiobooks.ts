// src/lib/db/queries/audiobooks.ts
// Audiobook CRUD operations

import { AudioBook } from '@/types';
import { getNeonClient } from '../client';
import { getFirstRow } from '../utils';

/**
 * Get audiobook by book_id
 */
export async function getAudioBookById(id: string): Promise<AudioBook | undefined> {
    const client = getNeonClient();
    const res = await client.query(
        `SELECT id, book_id, media_id, audio_length, publishing_date FROM audiobooks WHERE book_id = $1`,
        [id]
    );

    const audioBook = getFirstRow<AudioBook>(res);
    if (!audioBook) return undefined;

    return audioBook;
}

/**
 * Insert or update audiobook data (upsert by book_id)
 * @returns Promise<boolean> - True if the operation was successful, false otherwise
 */
export async function saveAudioBook(data: {
    book_id: string;
    media_id: string | null;
    audio_length: number | null;
    publishing_date: string | null;
}): Promise<boolean> {
    const client = getNeonClient();
    console.log('[saveAudioBook] data:', data);

    try {
        // Try update first
        const updateRes = await client.query(
            `UPDATE audiobooks SET media_id = $1, audio_length = $2, publishing_date = $3, updated_at = NOW() WHERE book_id = $4 RETURNING book_id`,
            [data.media_id, data.audio_length, data.publishing_date, data.book_id]
        );

        console.log('[saveAudioBook] updateRes:', updateRes);

        // If no rows were updated, try to insert
        const wasUpdated = Array.isArray(updateRes)
            ? updateRes.length > 0
            : updateRes?.rowCount > 0;

        if (!wasUpdated) {
            try {
                const insertRes = await client.query(
                    `INSERT INTO audiobooks (book_id, media_id, audio_length, publishing_date) 
                     VALUES ($1, $2, $3, $4) RETURNING book_id`,
                    [data.book_id, data.media_id, data.audio_length, data.publishing_date]
                );
                console.log('[saveAudioBook] insertRes:', insertRes);

                // Check if insert was successful
                return Array.isArray(insertRes)
                    ? insertRes.length > 0
                    : insertRes?.rowCount > 0;
            } catch (insertError) {
                console.error('[saveAudioBook] Error inserting audiobook:', insertError);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('[saveAudioBook] Error saving audiobook:', error);
        return false;
    }
}

/**
 * Delete an audiobook by book_id
 * @param bookId - The ID of the book whose audiobook to delete
 * @returns Promise<boolean> - True if the audiobook was deleted, false if no audiobook was found with the given book ID
 */
export async function deleteAudioBook(bookId: string): Promise<boolean> {
    if (!bookId) {
        throw new Error('Book ID is required');
    }

    const client = getNeonClient();

    try {
        // Execute the delete query with RETURNING to confirm the deletion
        const result = await client.query(
            'DELETE FROM audiobooks WHERE book_id = $1 RETURNING book_id',
            [bookId]
        );

        // Check if any rows were affected
        return Array.isArray(result) ? result.length > 0 : false;
    } catch (error) {
        console.error('Error deleting audiobook:', error);
        throw error;
    }
}
