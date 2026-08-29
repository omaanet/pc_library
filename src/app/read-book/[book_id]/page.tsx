import { notFound } from 'next/navigation';
import { getBookById, getBookmarksForBook /*, getAudioBookById */ } from '@/lib/db';
import ClientReadBookPage from './ClientReadBookPage';
import { getCurrentSessionUser } from '@/lib/auth-utils';
import { canAccessReading } from '@/lib/book-visibility';
import { getBookAccessSettings } from '@/lib/db/queries/book-access-settings';

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

    const [book, user, bookAccess] = await Promise.all([
        getBookById(book_id),
        getCurrentSessionUser(),
        getBookAccessSettings(),
    ]);
    if (
        !book
        || !canAccessReading(book, !!user?.isAdmin)
        || (bookAccess.requireAuthenticationForBookAccess && !user)
    ) {
        notFound();
    }
    const initialPage = book ? await getInitialReaderPage(book_id, book.pagesCount || 1) : 1;

    return <ClientReadBookPage book={book} bookId={book_id} initialPage={initialPage} />;
} 
