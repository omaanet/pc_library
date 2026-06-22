import { NextRequest, NextResponse } from 'next/server';
import { fetchAudioBook, saveOrUpdateAudioBook } from '@/lib/services/audiobooks-service';
import { handleApiError, ApiError, HttpStatus } from '@/lib/api-error-handler';
import { getBookById } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-utils';
import { canAccessAudio } from '@/lib/book-visibility';
import { requireManagedPageAccess } from '@/lib/admin-auth';
import { getManagedPage } from '@/lib/db/queries/managed-pages';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ book_id: string }> }
) {
    try {
        const bookId = (await params).book_id;
        const book = await getBookById(bookId);
        const user = await getSessionUser(req);
        const booksPage = user ? await getManagedPage('books') : null;
        const canManageBooks = !!user && (user.userLevel ?? 0) >= (booksPage?.accessLevel ?? Number.POSITIVE_INFINITY);
        if (!book || !canAccessAudio(book, canManageBooks)) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Audiobook not found');
        }
        const audiobook = await fetchAudioBook(bookId);

        if (!audiobook) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Audiobook not found');
        }

        return NextResponse.json(audiobook);
    } catch (error) {
        console.error('Error fetching audiobook:', error);
        return handleApiError(error, 'Failed to fetch audiobook data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ book_id: string }> }
) {
    try {
        await requireManagedPageAccess('books');
        const bookId = (await params).book_id;
        const body = await req.json();

        const audiobook = await saveOrUpdateAudioBook({
            book_id: bookId,
            media_id: body.media_id,
            audio_length: body.audio_length ? Number(body.audio_length) : null,
            publishing_date: body.publishing_date,
            intro_audio_override: body.intro_audio_override,
            intro_audio_title: body.intro_audio_title,
            intro_audio_id: body.intro_audio_id
        });

        return NextResponse.json(audiobook);
    } catch (error) {
        console.error('Error saving audiobook:', error);
        return handleApiError(error, 'Failed to save audiobook data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
