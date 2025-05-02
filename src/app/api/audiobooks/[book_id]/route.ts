import { NextRequest, NextResponse } from 'next/server';
import { fetchAudioBook, saveOrUpdateAudioBook } from '@/lib/services/audiobooks-service';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ book_id: string }> }
) {
    try {
        const bookId = (await params).book_id;
        const audiobook = fetchAudioBook(bookId);

        if (!audiobook) {
            return NextResponse.json({ message: 'Audiobook not found' }, { status: 404 });
        }

        return NextResponse.json(audiobook);
    } catch (error) {
        console.error('Error fetching audiobook:', error);
        return NextResponse.json(
            { message: 'Failed to fetch audiobook data' },
            { status: 500 }
        );
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ book_id: string }> }
) {
    try {
        const bookId = (await params).book_id;
        const body = await req.json();

        const audiobook = saveOrUpdateAudioBook({
            book_id: bookId,
            media_id: body.media_id,
            audio_length: body.audio_length ? Number(body.audio_length) : null,
            publishing_date: body.publishing_date
        });

        return NextResponse.json(audiobook);
    } catch (error) {
        console.error('Error saving audiobook:', error);
        return NextResponse.json(
            { message: 'Failed to save audiobook data' },
            { status: 500 }
        );
    }
}
