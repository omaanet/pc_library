// src/app/api/books/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBookById, updateBook, deleteBook, getAudioBookById, deleteAudioBook } from '@/lib/db';
import { saveOrUpdateAudioBook, fetchAudioBook } from '@/lib/services/audiobooks-service';
import { handleApiError, ApiError, HttpStatus } from '@/lib/api-error-handler';
import { requireAdmin } from '@/lib/admin-auth';
import { normalizeBookVisibility } from '@/lib/book-visibility';
import { canAccessBook } from '@/lib/book-visibility';
import { getSessionUser } from '@/lib/auth-utils';
import { withCSRFProtection } from '@/lib/csrf-middleware';

type NormalizedAudiobookPayload = {
    mediaId?: string | null;
    introAudioOverride?: boolean;
    introAudioTitle?: string | null;
    introAudioId?: string | null;
};

function normalizeStringField(
    value: unknown,
    fieldName: string
): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== 'string') {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Validation failed',
            { audiobook: [`${fieldName} must be null, undefined, or a string`] }
        );
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function normalizeAudiobookPayload(payload: unknown): NormalizedAudiobookPayload | undefined {
    if (payload === undefined || payload === null) {
        return undefined;
    }

    if (typeof payload === 'string') {
        return {
            mediaId: payload.trim().length > 0 ? payload.trim() : null
        };
    }

    if (typeof payload !== 'object' || Array.isArray(payload)) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Validation failed',
            { audiobook: ['Value must be an object or string'] }
        );
    }

    const audiobook = payload as Record<string, unknown>;
    const mediaId = normalizeStringField(audiobook.mediaId, 'mediaId');
    const introAudioTitle = normalizeStringField(audiobook.introAudioTitle, 'introAudioTitle');
    const introAudioId = normalizeStringField(audiobook.introAudioId, 'introAudioId');

    if (
        audiobook.introAudioOverride !== undefined &&
        audiobook.introAudioOverride !== null &&
        typeof audiobook.introAudioOverride !== 'boolean'
    ) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Validation failed',
            { audiobook: ['introAudioOverride must be null, undefined, or a boolean'] }
        );
    }

    const introAudioOverride =
        audiobook.introAudioOverride === undefined || audiobook.introAudioOverride === null
            ? undefined
            : audiobook.introAudioOverride;

    if (introAudioOverride) {
        const missingFields: string[] = [];
        if (!introAudioTitle) missingFields.push('introAudioTitle');
        if (!introAudioId) missingFields.push('introAudioId');

        if (missingFields.length > 0) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Validation failed',
                {
                    audiobook: [
                        `When introAudioOverride is enabled, ${missingFields.join(' and ')} ${missingFields.length > 1 ? 'are' : 'is'} required`
                    ]
                }
            );
        }
    }

    return {
        mediaId,
        introAudioOverride,
        introAudioTitle,
        introAudioId
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const book = await getBookById(id);

        if (!book) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Book not found');
        }
        const user = await getSessionUser(request);
        if (!canAccessBook(book, !!user?.isAdmin)) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Book not found');
        }

        // If the book has audio, populate audiobook.mediaId from AudioBook record
        if (book.hasAudio) {
            const audioBook = await fetchAudioBook(id);
            if (audioBook) {
                // Initialize or update the audiobook property with correct structure
                // mediaId comes from audiobook record, audioLength is kept directly on book object
                book.audiobook = {
                    mediaId: audioBook.media_id,
                    introAudioOverride: Boolean(audioBook.intro_audio_override),
                    introAudioTitle: audioBook.intro_audio_title ?? null,
                    introAudioId: audioBook.intro_audio_id ?? null
                };
            } else if (!book.audiobook) {
                // Ensure audiobook property exists even if no audioBook record found
                book.audiobook = {
                    mediaId: null,
                    introAudioOverride: false,
                    introAudioTitle: null,
                    introAudioId: null
                };
            }
        }

        return NextResponse.json(book);
    } catch (error) {
        console.error('API Error fetching book:', error);
        return handleApiError(error, 'Failed to fetch book', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export const PUT = withCSRFProtection(async function (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Require admin authorization
        await requireAdmin();

        const id = (await params).id;
        const book = await request.json();
        const normalizedAudiobook = normalizeAudiobookPayload(book.audiobook);
        if (normalizedAudiobook !== undefined) {
            book.audiobook = normalizedAudiobook;
        }

        // Get the current book to check if hasAudio is changing
        const currentBook = await getBookById(id);
        if (!currentBook) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Book not found');
        }

        const hadAudio = currentBook.hasAudio;
        const hasAudioChanged = hadAudio !== book.hasAudio;
        const visibility = normalizeBookVisibility(book, {
            isReadingVisible: currentBook.isReadingVisible,
            isAudioVisible: currentBook.isAudioVisible,
        });
        book.isReadingVisible = visibility.isReadingVisible;
        book.isAudioVisible = visibility.isAudioVisible;
        delete book.isVisible;

        // Update the book
        const success = await updateBook(id, book);

        if (!success) {
            throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to update book');
        }

        // Handle audiobook data if the book has audio
        if (book.hasAudio) {
            // Save or update the audiobook entry
            // For mediaId, use book.audiobook?.mediaId if provided
            // For audioLength, use book.audioLength (this updates audio_length in both tables)
            await saveOrUpdateAudioBook({
                book_id: id,
                media_id: book.audiobook?.mediaId || null,
                audio_length: book.audioLength || null,
                publishing_date: book.publishingDate || null,
                intro_audio_override: book.audiobook?.introAudioOverride,
                intro_audio_title: book.audiobook?.introAudioTitle ?? null,
                intro_audio_id: book.audiobook?.introAudioId ?? null
            });
        } else if (hasAudioChanged && hadAudio) {
            // If we're changing from hasAudio=true to false, delete the audiobook entry
            await deleteAudioBook(id);
        }

        // Fetch the complete updated book with all its data
        const updatedBook = await getBookById(id);
        if (!updatedBook) {
            throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch updated book');
        }

        return NextResponse.json(updatedBook);
    } catch (error) {
        console.error('API Error updating book:', error);
        return handleApiError(error, 'Failed to update book', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});

export const DELETE = withCSRFProtection(async function (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Require admin authorization
        await requireAdmin();

        const id = (await params).id;

        // First, check if the book exists and has an associated audiobook
        const book = await getBookById(id);
        if (!book) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Book not found');
        }

        // Delete the book (this will cascade to the audiobook if foreign key constraints are set up)
        const success = await deleteBook(id);

        if (!success) {
            throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete book');
        }

        // If the book had an audiobook, delete it explicitly
        if (book.hasAudio) {
            await deleteAudioBook(id);
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('API Error deleting book:', error);
        return handleApiError(error, 'Failed to delete book', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});
