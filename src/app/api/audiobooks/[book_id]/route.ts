import { NextRequest, NextResponse } from 'next/server';
import audiobooksService from '@/lib/services/audiobooks-service';

export async function GET(
    request: NextRequest,
    { params }: { params: { book_id: string } }
) {
    try {
        const bookId = params.book_id;
        const audiobook = audiobooksService.getByBookId(bookId);

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
    request: NextRequest,
    { params }: { params: { book_id: string } }
) {
    try {
        const bookId = params.book_id;
        const body = await request.json();

        const audiobook = audiobooksService.save({
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
