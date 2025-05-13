import { notFound } from 'next/navigation';
import { getBookById /*, getAudioBookById */ } from '@/lib/db';
import ClientReadBookPage from './ClientReadBookPage';

export default async function ReadBookPage({ params }: { params: Promise<{ book_id: string }> }) {
    const resolvedParams = await params;
    const { book_id } = resolvedParams;

    // Validate book_id
    if (typeof book_id !== 'string' || book_id.length < 6 || !book_id.startsWith('book-')) {
        notFound();
    }

    const book = await getBookById(book_id);
    return <ClientReadBookPage bookId={book_id} book={book} />;
} 