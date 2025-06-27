// src/app/api/books/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBookById, updateBook, deleteBook, getAudioBookById, deleteAudioBook } from '@/lib/db';
import { saveOrUpdateAudioBook, fetchAudioBook } from '@/lib/services/audiobooks-service';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const book = await getBookById(id);

        if (!book) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
        }

        // If the book has audio, populate audiobook.mediaId from AudioBook record
        if (book.hasAudio) {
            const audioBook = await fetchAudioBook(id);
            if (audioBook) {
                // Initialize or update the audiobook property with correct structure
                // mediaId comes from audiobook record, audioLength is kept directly on book object
                book.audiobook = {
                    mediaId: audioBook.media_id
                };
            } else if (!book.audiobook) {
                // Ensure audiobook property exists even if no audioBook record found
                book.audiobook = {
                    mediaId: null
                };
            }
        }

        return NextResponse.json(book);
    } catch (error) {
        console.error('API Error fetching book:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch book',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const book = await request.json();

        // Get the current book to check if hasAudio is changing
        const currentBook = await getBookById(id);
        if (!currentBook) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
        }

        const hadAudio = currentBook.hasAudio;
        const hasAudioChanged = hadAudio !== book.hasAudio;

        // Update the book
        const success = await updateBook(id, book);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to update book' },
                { status: 500 }
            );
        }

        // Handle audiobook data if the book has audio
        if (book.hasAudio) {
            // Save or update the audiobook entry
            // For mediaId, use book.audiobook?.mediaId if provided
            // For audioLength, use book.audioLength (this updates audio_length in both tables)
            await saveOrUpdateAudioBook({
                book_id: id,
                media_id: book.audiobook?.mediaId || null,
                audio_length: book.audioLength || null,
                publishing_date: book.publishingDate || null
            });
        } else if (hasAudioChanged && hadAudio) {
            // If we're changing from hasAudio=true to false, delete the audiobook entry
            await deleteAudioBook(id);
        }

        // Fetch the complete updated book with all its data
        const updatedBook = await getBookById(id);
        if (!updatedBook) {
            return NextResponse.json(
                { error: 'Failed to fetch updated book' },
                { status: 500 }
            );
        }

        return NextResponse.json(updatedBook);
    } catch (error) {
        console.error('API Error updating book:', error);
        return NextResponse.json(
            {
                error: 'Failed to update book',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;

        // First, check if the book exists and has an associated audiobook
        const book = await getBookById(id);
        if (!book) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
        }

        // Delete the book (this will cascade to the audiobook if foreign key constraints are set up)
        const success = await deleteBook(id);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to delete book' },
                { status: 500 }
            );
        }

        // If the book had an audiobook, delete it explicitly
        if (book.hasAudio) {
            await deleteAudioBook(id);
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('API Error deleting book:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete book',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
