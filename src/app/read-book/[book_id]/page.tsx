
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getBookById, getAudioBookById } from '@/lib/db';
// import { AudioBook, Book } from '@/types';
import HTML5Player from '@/components/HTML5Player';
import { BackButton } from './BackButton';
// import fs from 'fs';
// import path from 'path';

// import Database from 'better-sqlite3';
// import path from 'path';

// Import EPUBViewer as a dynamic component with SSR disabled
const EPUBViewer = dynamic(
    () => import('./EPUBViewer').then(mod => mod.default)
);

export default async function ReadBookPage({ params }: { params: Promise<{ book_id: string }> }) {
    const resolvedParams = await params;
    const { book_id } = resolvedParams;

    // Validate book_id
    if (typeof book_id !== 'string' || book_id.length < 6 || !book_id.startsWith('book-')) {
        notFound();
    }

    const book = getBookById(book_id);

    const hasAudio = book?.hasAudio || false;
    let myTracks: { title: string; url: string }[];
    if (hasAudio) {
        const audiobook = getAudioBookById(book_id);

        myTracks = [
            {
                title: 'Nota per la beneficenza',
                url: 'https://s3.eu-south-1.wasabisys.com/piero-audiolibri/Nota per la beneficenza.mp3'
            },
            {
                title: book?.title || '',
                url: `https://s3.eu-south-1.wasabisys.com/piero-audiolibri/${audiobook?.media_id}`
            }
        ];
    }
    else {
        myTracks = [];
    }

    // const has_dir = fs.existsSync(path.join(process.cwd(), 'public', 'epub', book_id));
    const darkMode: boolean = false;

    return (
        <div className="h-full w-full ">
            {/* <div className="flex flex-col"> */}
            <BackButton />
            <div className={`min-h-screen flex flex-col relative ${darkMode ? 'bg-zinc-900 text-gray-200' : 'bg-zinc-50 text-gray-800'}`}>
                {hasAudio && (
                    <div className="absolute top-0 left-0 right-0 z-20 w-full text-center p-0 rounded-md my-2 mx-auto max-w-lg">
                        <HTML5Player
                            tracks={myTracks}
                            autoPlay={false}
                        />
                    </div>)}
                {(book) && (
                    <div className="pt-[90px] h-screen w-full overflow-hidden">
                        <EPUBViewer bookId={book_id} book={book} />
                    </div>
                )}
            </div>
        </div>
    );
}