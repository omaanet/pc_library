import { NextRequest, NextResponse } from 'next/server';
import { getAudioBookById, getBookById, getNeonClient } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-utils';
import { canAccessAudio, isReadingAvailable } from '@/lib/book-visibility';
import { ApiError, handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logging';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({})) as {
            bookId?: unknown;
            mediaId?: unknown;
        };
        const bookId = typeof body.bookId === 'string' ? body.bookId : '';
        const mediaId = typeof body.mediaId === 'string' ? body.mediaId : '';

        if (!bookId || !mediaId) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Missing audio tracking fields');
        }

        const user = await getSessionUser(request);
        const book = await getBookById(bookId);
        if (!book || !canAccessAudio(book, !!user?.isAdmin)) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Audiobook not found');
        }

        const audiobook = await getAudioBookById(bookId);
        if (!audiobook?.media_id || audiobook.media_id !== mediaId) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Audiobook not found');
        }

        const requestContext = Logger.extractRequestContext(request);
        const details = {
            bookId,
            bookTitle: book.title,
            mediaId,
            audioLength: audiobook.audio_length ?? book.audioLength ?? null,
            isAudioOnly: !isReadingAvailable(book),
        };

        const client = getNeonClient();
        await client.query(
            `INSERT INTO system_logs (level, source, message, details, user_id, ip_address, request_path)
             VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)`,
            [
                'info',
                'audio-book',
                '[audio-play]',
                JSON.stringify(details),
                user?.id ?? null,
                requestContext.ipAddress ?? null,
                requestContext.requestPath ?? null,
            ]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, 'Failed to track audio play');
    }
}
