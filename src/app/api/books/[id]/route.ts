// src/app/api/books/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBookById, updateBook, deleteBook } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const book = getBookById(id);

        if (!book) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
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

        const success = updateBook(id, book);

        if (!success) {
            return NextResponse.json(
                { error: 'Book not found or no changes made' },
                { status: 404 }
            );
        }

        const updatedBook = getBookById(id);
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
        const success = deleteBook(id);

        if (!success) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
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
