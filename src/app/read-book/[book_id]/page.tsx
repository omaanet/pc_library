import { notFound } from 'next/navigation';
import { getBookById, getBookmarksForBook /*, getAudioBookById */ } from '@/lib/db';
import ClientReadBookPage from './ClientReadBookPage';
import { getCurrentSessionUser } from '@/lib/auth-utils';
import { canAccessReading } from '@/lib/book-visibility';

async function getInitialReaderPage(bookId: string, totalPages: number): Promise<number> {
    try {
        const user = await getCurrentSessionUser();
        if (!user) return 1;
        const bookmarks = await getBookmarksForBook(user.id, bookId);
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
    const user = await getCurrentSessionUser();
    if (!book || !canAccessReading(book, !!user?.isAdmin)) {
        notFound();
    }
    const initialPage = book ? await getInitialReaderPage(book_id, book.pagesCount || 1) : 1;

    return <ClientReadBookPage book={book} bookId={book_id} initialPage={initialPage} />;
} 
