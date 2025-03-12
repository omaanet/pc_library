// src/app/api/books/route.ts
import { NextResponse } from 'next/server';
import { getAllBooks, createBook } from '@/lib/db';
import type { Book } from '@/types';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);

        // Get all books from the database
        const allBooks = getAllBooks();

        // Parse parameters with defaults
        const page = parseInt(url.searchParams.get('page') ?? '1');
        const perPage = parseInt(url.searchParams.get('perPage') ?? '20');
        const search = url.searchParams.get('search') || undefined;
        const hasAudio = url.searchParams.get('hasAudio') === 'true' ? true :
            url.searchParams.get('hasAudio') === 'false' ? false : undefined;
        const sortBy = url.searchParams.get('sortBy') || 'title';
        const sortOrder = url.searchParams.get('sortOrder') || 'asc';

        // Filter books
        let filteredBooks = [...allBooks];

        if (search) {
            const searchLower = search.toLowerCase();
            filteredBooks = filteredBooks.filter(book =>
                book.title.toLowerCase().includes(searchLower) ||
                book.summary.toLowerCase().includes(searchLower)
            );
        }

        if (hasAudio !== undefined) {
            filteredBooks = filteredBooks.filter(book => book.hasAudio === hasAudio);
        }

        // Sort books
        filteredBooks.sort((a: Book, b: Book) => {
            const aValue = a[sortBy as keyof Book];
            const bValue = b[sortBy as keyof Book];

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortOrder === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }

            if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                return sortOrder === 'asc'
                    ? (aValue ? 1 : 0) - (bValue ? 1 : 0)
                    : (bValue ? 1 : 0) - (aValue ? 1 : 0);
            }

            return 0;
        });

        // Paginate
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginatedBooks = filteredBooks.slice(start, end);

        const result = {
            books: paginatedBooks,
            pagination: {
                total: filteredBooks.length,
                page,
                perPage,
                totalPages: Math.ceil(filteredBooks.length / perPage),
            }
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('API Error fetching books:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch books',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const bookData = await request.json();

        // Validate required fields
        const requiredFields = ['title', 'coverImage', 'publishingDate', 'summary', 'hasAudio'];
        for (const field of requiredFields) {
            if (bookData[field] === undefined) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        const newBook = createBook(bookData);

        return NextResponse.json(newBook, { status: 201 });
    } catch (error) {
        console.error('API Error creating book:', error);
        return NextResponse.json(
            {
                error: 'Failed to create book',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}