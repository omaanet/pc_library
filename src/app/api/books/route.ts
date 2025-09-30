// src/app/api/books/route.ts
import { NextResponse } from 'next/server';
import { getAllBooksOptimized, createBook, BookQueryOptions, getBookById } from '@/lib/db';
import { saveOrUpdateAudioBook } from '@/lib/services/audiobooks-service';
import { validateObject } from '@/lib/validation';

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

        // return NextResponse.json({ message: 'GET request not implemented' }, { status: 501 });

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
        const result = await getAllBooksOptimized(queryOptions);

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

        // Define validation schema for book data
        const validationSchema = {
            title: {
                type: 'string' as const,
                required: true,
                minLength: 1,
                maxLength: 500,
                sanitize: true
            },
            coverImage: {
                type: 'url' as const,
                required: true
            },
            publishingDate: {
                type: 'date' as const,
                required: true
            },
            summary: {
                type: 'string' as const,
                required: true,
                minLength: 10,
                maxLength: 5000,
                sanitize: true
            },
            hasAudio: {
                type: 'boolean' as const,
                required: true
            },
            audioLength: {
                type: 'number' as const,
                required: false,
                customValidator: (value: any) => value === null || value === undefined || (typeof value === 'number' && value > 0)
            },
            audiobook: {
                type: 'string' as const, // We'll validate the nested structure separately
                required: false
            },
            audioMediaId: {
                type: 'string' as const,
                required: false,
                maxLength: 255
            },
            extract: {
                type: 'string' as const,
                required: false,
                maxLength: 2000,
                sanitize: true
            },
            rating: {
                type: 'number' as const,
                required: false,
                customValidator: (value: any) => value === null || value === undefined || (typeof value === 'number' && value >= 0 && value <= 5)
            },
            isPreview: {
                type: 'boolean' as const,
                required: false
            },
            displayOrder: {
                type: 'number' as const,
                required: false,
                customValidator: (value: any) => value === null || value === undefined || (typeof value === 'number' && value >= 0)
            },
            isVisible: {
                type: 'number' as const,
                required: false,
                customValidator: (value: any) => value === null || value === undefined || [0, 1, -1].includes(value)
            },
            pagesCount: {
                type: 'number' as const,
                required: false,
                customValidator: (value: any) => value === null || value === undefined || (typeof value === 'number' && value > 0)
            }
        };

        // Validate input data
        const validation = validateObject(bookData, validationSchema);
        if (!validation.isValid) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validation.errors
                },
                { status: 400 }
            );
        }

        // Use sanitized data for database operations
        const sanitizedData = validation.sanitizedData;

        const newBook = await createBook(sanitizedData);
        if (!newBook) {
            return NextResponse.json(
                { error: 'Failed to create book' },
                { status: 500 }
            );
        }

        // If the book has audio, create/update the audiobook entry
        if (sanitizedData.hasAudio) {
            // Use audiobook.mediaId if available, fall back to audioMediaId for backward compatibility
            // This follows the special case handling where audiobook.mediaId can't be derived from Book
            const mediaId = sanitizedData.audiobook?.mediaId || sanitizedData.audioMediaId || null;

            // When creating/updating an audiobook:
            // - audioLength will update both values 'audio_length' in database's tables: 'books' and 'audiobooks'
            // - mediaId will update 'media_id' in database's table 'audiobooks'
            const audioBookSaved = await saveOrUpdateAudioBook({
                book_id: newBook.id,
                media_id: mediaId,
                audio_length: sanitizedData.audioLength || null,
                publishing_date: sanitizedData.publishingDate || null
            });

            if (!audioBookSaved) {
                console.error(`[POST /api/books] Failed to save audiobook for book ${newBook.id}`);
                // Continue even if audiobook save fails, as the book was created successfully
            }
        }

        // Fetch the complete book with all its data
        const createdBook = await getBookById(newBook.id);
        if (!createdBook) {
            return NextResponse.json(
                { error: 'Failed to fetch created book' },
                { status: 500 }
            );
        }

        return NextResponse.json(createdBook, { status: 201 });
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