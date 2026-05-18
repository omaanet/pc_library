import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getBookById, getBookmarksForBook /*, getAudioBookById */ } from '@/lib/db';
import ClientReadBookPage from './ClientReadBookPage';

async function getInitialReaderPage(bookId: string, totalPages: number): Promise<number> {
    try {
        const sessionCookie = (await cookies()).get('session')?.value;
        if (!sessionCookie) return 1;

        const sessionData = JSON.parse(
            Buffer.from(sessionCookie, 'base64').toString('utf-8')
        ) as { userId?: string | number; expires?: string };

        if (!sessionData.userId || !sessionData.expires || new Date(sessionData.expires) < new Date()) {
            return 1;
        }

        const bookmarks = await getBookmarksForBook(Number(sessionData.userId), bookId);
        const pageNumber = bookmarks.reader?.pageNumber;

        if (!pageNumber || pageNumber < 1) return 1;
        return Math.min(pageNumber, totalPages);
    } catch (error) {
        console.error('Failed to resolve initial reader bookmark:', error);
        return 1;
    }
}

export default async function ReadBookPage({ params }: { params: Promise<{ book_id: string }> }) {
    const resolvedParams = await params;
    const { book_id } = resolvedParams;

    // Validate book_id
    if (typeof book_id !== 'string' || book_id.length < 6 || !book_id.startsWith('book-')) {
        notFound();
    }

    const book = await getBookById(book_id);
    const initialPage = book ? await getInitialReaderPage(book_id, book.pagesCount || 1) : 1;

    return <ClientReadBookPage book={book} bookId={book_id} initialPage={initialPage} />;
} 
