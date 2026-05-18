import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-utils';
import { handleApiError, ApiError, HttpStatus } from '@/lib/api-error-handler';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import {
    deleteBookmark,
    getAudioBookById,
    getBookById,
    getBookmarksForBook,
    upsertBookmark,
    type BookmarkKind,
} from '@/lib/db';

type RouteContext = { params: Promise<{ book_id: string }> };

type BookmarkPayload = {
    kind?: unknown;
    pageNumber?: unknown;
    audioTimeSeconds?: unknown;
};

function isBookmarkKind(value: unknown): value is BookmarkKind {
    return value === 'reader' || value === 'audio';
}

function parseFiniteInteger(value: unknown, fieldName: string): number {
    const parsed = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        throw new ApiError(HttpStatus.BAD_REQUEST, `${fieldName} must be an integer`);
    }

    return parsed;
}

async function validateBookId(bookId: string) {
    if (typeof bookId !== 'string' || !bookId.startsWith('book-')) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid book id');
    }

    const book = await getBookById(bookId);
    if (!book) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Book not found');
    }

    return book;
}

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const user = await getSessionUser(request);
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
        }

        const { book_id: bookId } = await context.params;
        await validateBookId(bookId);

        const bookmarks = await getBookmarksForBook(user.id, bookId);
        return NextResponse.json(bookmarks);
    } catch (error) {
        return handleApiError(error, 'Failed to fetch bookmarks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export const PUT = withCSRFProtection(async function(request: NextRequest, context: RouteContext) {
    try {
        const user = await getSessionUser(request);
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
        }

        const { book_id: bookId } = await context.params;
        const book = await validateBookId(bookId);
        const body = await request.json() as BookmarkPayload;

        if (!isBookmarkKind(body.kind)) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'kind must be reader or audio');
        }

        if (body.kind === 'reader') {
            const pageNumber = parseFiniteInteger(body.pageNumber, 'pageNumber');
            const totalPages = book.pagesCount;

            if (pageNumber < 1 || (totalPages && pageNumber > totalPages)) {
                throw new ApiError(HttpStatus.BAD_REQUEST, 'pageNumber is outside the book page range');
            }

            const bookmark = await upsertBookmark({
                userId: user.id,
                bookId,
                kind: 'reader',
                pageNumber,
                audioTimeSeconds: null,
                audioMediaId: null,
            });

            return NextResponse.json({ bookmark });
        }

        if (!book.hasAudio) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Book does not have audio');
        }

        const audiobook = await getAudioBookById(bookId);
        if (!audiobook?.media_id) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Audiobook is not available');
        }

        const audioTimeSeconds = parseFiniteInteger(body.audioTimeSeconds, 'audioTimeSeconds');
        const audioLength = audiobook.audio_length ?? book.audioLength;

        if (audioTimeSeconds < 0 || (audioLength && audioTimeSeconds > audioLength)) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'audioTimeSeconds is outside the audio duration');
        }

        const bookmark = await upsertBookmark({
            userId: user.id,
            bookId,
            kind: 'audio',
            pageNumber: null,
            audioTimeSeconds,
            audioMediaId: audiobook.media_id,
        });

        return NextResponse.json({ bookmark });
    } catch (error) {
        return handleApiError(error, 'Failed to save bookmark', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});

export const DELETE = withCSRFProtection(async function(request: NextRequest, context: RouteContext) {
    try {
        const user = await getSessionUser(request);
        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
        }

        const { book_id: bookId } = await context.params;
        await validateBookId(bookId);

        const kind = request.nextUrl.searchParams.get('kind');
        if (!isBookmarkKind(kind)) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'kind must be reader or audio');
        }

        const deleted = await deleteBookmark(user.id, bookId, kind);
        return NextResponse.json({ deleted });
    } catch (error) {
        return handleApiError(error, 'Failed to delete bookmark', HttpStatus.INTERNAL_SERVER_ERROR);
    }
});
