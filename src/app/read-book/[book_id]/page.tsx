import { notFound } from 'next/navigation';
import { getBookById, getAudioBookById } from '@/lib/db';
import ClientReadBookPage from './ClientReadBookPage'; // OptionsSidebar used in client page

export default async function ReadBookPage({ params }: { params: Promise<{ book_id: string }> }) {
    const resolvedParams = await params;
    const { book_id } = resolvedParams;

    // Validate book_id
    if (typeof book_id !== 'string' || book_id.length < 6 || !book_id.startsWith('book-')) {
        notFound();
    }

    const book = getBookById(book_id);
    // const hasAudio = book?.hasAudio || false;
    // let myTracks: { title: string; url: string }[];
    // if (hasAudio) {
    //     const audiobook = getAudioBookById(book_id);
    //     myTracks = [
    //         {
    //             title: 'Nota per la beneficenza',
    //             url: 'https://s3.eu-south-1.wasabisys.com/piero-audiolibri/Nota per la beneficenza.mp3'
    //         },
    //         {
    //             title: book?.title || '',
    //             url: `https://s3.eu-south-1.wasabisys.com/piero-audiolibri/${audiobook?.media_id}`
    //         }
    //     ];
    // } else {
    //     myTracks = [];
    // }

    // return <ClientReadBookPage bookId={book_id} book={book} myTracks={myTracks} hasAudio={hasAudio} />;
    return <ClientReadBookPage bookId={book_id} book={book} />;
}