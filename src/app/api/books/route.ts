// src/app/api/books/route.ts
import { NextResponse } from 'next/server';
import { getAllBooksOptimized, createBook, BookQueryOptions } from '@/lib/db';
// import type { Book } from '@/types';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);

        // Parse parameters with defaults
        const page = parseInt(url.searchParams.get('page') ?? '1');
        const perPage = parseInt(url.searchParams.get('perPage') ?? '-1');
        const search = url.searchParams.get('search') || undefined;
        const hasAudio = url.searchParams.get('hasAudio') === 'true' ? true :
            url.searchParams.get('hasAudio') === 'false' ? false : undefined;

        // Parse displayPreviews parameter (-1: all, 0: non-preview only, 1: preview only)
        const displayPreviewsParam = url.searchParams.get('displayPreviews');
        const displayPreviews = displayPreviewsParam ?
            parseInt(displayPreviewsParam) : 0; // Default to non-preview books (0)

        const isVisibleParam = url.searchParams.get('isVisible');
        const isVisible: number | null = isVisibleParam ?
            parseInt(isVisibleParam) : -1; // Default to visible books (-1)

        // Parse sorting parameters
        const sortBy: [string, 'ASC' | 'DESC'][] | string | undefined = undefined;
        const sortByParam = url.searchParams.get('sortBy');
        const sortOrder = (url.searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

        // Check if we have a compound sort request via ?sort parameter
        const sortParam = url.searchParams.get('sort');
        // if (sortParam) {
        //     try {
        //         // Parse JSON sort definition from URL parameter
        //         // Expected format: [['has_audio','ASC'],['publishing_date','DESC']]
        //         sortBy = JSON.parse(sortParam);

        //         // Validate the structure
        //         if (!Array.isArray(sortBy) ||
        //             !sortBy.every(item =>
        //                 Array.isArray(item) &&
        //                 item.length === 2 &&
        //                 typeof item[0] === 'string' &&
        //                 ['ASC', 'DESC'].includes(item[1].toUpperCase())
        //             )
        //         ) {
        //             // If invalid, fallback to default
        //             // sortBy = [['has_audio', 'ASC'], ['title', 'ASC']];
        //             sortBy = [['has_audio', 'ASC']];
        //         }
        //     } catch (e) {
        //         // If parse fails, use default sort
        //         // sortBy = [['has_audio', 'ASC'], ['title', 'ASC']];
        //         sortBy = [['has_audio', 'ASC']];
        //     }
        // } else if (sortByParam) {
        //     // Legacy single-column sort
        //     sortBy = sortByParam;
        // } else {
        //     // Default sort: hasAudio ASC, publishing_date DESC
        //     // sortBy = [['has_audio', 'ASC'], ['publishing_date', 'DESC']];
        //     sortBy = [['has_audio', 'ASC']];
        // }

        // sortBy = [['has_audio', 'ASC'], ['display_order', 'ASC']];

        // Prepare query options for the optimized function
        const queryOptions: BookQueryOptions = {
            search,
            hasAudio,
            sortBy: sortBy as [string, 'ASC' | 'DESC'][] | string | undefined,
            sortOrder,
            page,
            perPage,
            displayPreviews,
            isVisible
        };

        // Get books using the optimized function that handles filtering, sorting,
        // and pagination directly in SQL
        const result = getAllBooksOptimized(queryOptions);

        // Return formatted response
        return NextResponse.json({
            books: result.data,
            pagination: result.pagination
        });
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