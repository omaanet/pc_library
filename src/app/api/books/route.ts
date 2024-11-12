// src/app/api/books/route.ts
import { NextResponse } from 'next/server';
import { getPaginatedBooks } from '@/lib/mock/data';
import type { Book } from '@/types';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);

        // Parse parameters with defaults
        const page = parseInt(url.searchParams.get('page') ?? '1');
        const perPage = parseInt(url.searchParams.get('perPage') ?? '20');
        const search = url.searchParams.get('search') || undefined;
        const hasAudio = url.searchParams.get('hasAudio') === 'true' ? true : undefined;
        const sortBy = url.searchParams.get('sortBy') || 'title';
        const sortOrder = url.searchParams.get('sortOrder') || 'asc';

        // eslint-disable-next-line no-console
        console.log('API received params:', {
            page,
            perPage,
            search,
            hasAudio,
            sortBy,
            sortOrder
        });

        // Get paginated data
        const data = getPaginatedBooks(page, perPage, { search, hasAudio });

        // Sort books if needed
        if (data.books.length > 0) {
            data.books.sort((a: Book, b: Book) => {
                const aValue = a[sortBy as keyof Book];
                const bValue = b[sortBy as keyof Book];

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortOrder === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }
                return 0;
            });
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        return NextResponse.json(data);
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