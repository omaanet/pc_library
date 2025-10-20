// src/app/api/books/route.ts
import { NextResponse } from 'next/server';
import { getAllBooksOptimized, createBook, BookQueryOptions, getBookById } from '@/lib/db';
import { saveOrUpdateAudioBook } from '@/lib/services/audiobooks-service';
import { validateObject } from '@/lib/validation';
import { handleApiError, ApiError, HttpStatus } from '@/lib/api-error-handler';
import { SITE_CONFIG } from '@/config/site-config';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/books
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - perPage: Items per page (default: 10, -1 for all)
 * - search: Search term for title/summary
 * - hasAudio: Filter by audio availability (true/false)
 * - displayPreviews: -1 (all), 0 (non-preview only), 1 (preview only)
 * - isVisible: -1 (all), 0 (hidden), 1 (visible)
 * - sortBy: Column to sort by (optional, uses SITE_CONFIG.DEFAULT_SORT if not provided)
 * - sortOrder: Sort direction 'asc' or 'desc' (default: 'desc')
 * 
 * Available sort columns: id, title, publishing_date, summary, has_audio, 
 * audio_length, extract, rating, is_preview, created_at, updated_at, 
 * display_order, pages_count
 */
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);

        // Parse parameters with defaults
        const page = parseInt(url.searchParams.get('page') ?? String(SITE_CONFIG.PAGINATION.DEFAULT_PAGE));
        let perPage = parseInt(url.searchParams.get('perPage') ?? '-1');
        
        // Validate perPage is within allowed range (if pagination is enabled)
        if (perPage > 0) {
            if (perPage < SITE_CONFIG.PAGINATION.MIN_PER_PAGE) {
                perPage = SITE_CONFIG.PAGINATION.MIN_PER_PAGE;
            } else if (perPage > SITE_CONFIG.PAGINATION.MAX_PER_PAGE) {
                perPage = SITE_CONFIG.PAGINATION.MAX_PER_PAGE;
            }
        }
        
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
        // If sortBy is provided, use it; otherwise, getAllBooksOptimized will use SITE_CONFIG.DEFAULT_SORT
        const sortByParam = url.searchParams.get('sortBy');
        const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

        // Prepare query options for the optimized function
        const queryOptions: BookQueryOptions = {
            search,
            hasAudio,
            sortBy: sortByParam || undefined, // Pass sortBy only if provided
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
        return handleApiError(error, 'Failed to fetch books', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export async function POST(request: Request) {
    try {
        // Require admin authorization
        await requireAdmin();

        const bookData = await request.json();

        // Manually validate audiobook field (since it can be an object, not just a string)
        if (bookData.audiobook !== undefined && bookData.audiobook !== null) {
            if (typeof bookData.audiobook === 'object' && !Array.isArray(bookData.audiobook)) {
                // Valid object - check mediaId if present
                if ('mediaId' in bookData.audiobook) {
                    const mediaId = bookData.audiobook.mediaId;
                    if (mediaId !== null && mediaId !== undefined && typeof mediaId !== 'string') {
                        throw new ApiError(
                            HttpStatus.BAD_REQUEST,
                            'Validation failed',
                            { audiobook: ['mediaId must be null, undefined, or a string'] }
                        );
                    }
                }
            } else if (typeof bookData.audiobook !== 'string') {
                throw new ApiError(
                    HttpStatus.BAD_REQUEST,
                    'Validation failed',
                    { audiobook: ['Value must be an object or string'] }
                );
            }
        }

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
                type: 'string' as const,
                required: false
            },
            publishingDate: {
                type: 'date' as const,
                required: false
            },
            summary: {
                type: 'string' as const,
                required: false,
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
            // audiobook field is validated manually above (not included in schema)
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
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Validation failed',
                validation.errors
            );
        }

        // Use sanitized data for database operations
        const sanitizedData = validation.sanitizedData;
        
        // Add the manually validated audiobook field back to sanitizedData
        if (bookData.audiobook !== undefined) {
            sanitizedData.audiobook = bookData.audiobook;
        }

        const newBook = await createBook(sanitizedData);
        if (!newBook) {
            throw new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                'Failed to create book'
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
            throw new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                'Failed to fetch created book'
            );
        }

        return NextResponse.json(createdBook, { status: 201 });
    } catch (error) {
        console.error('API Error creating book:', error);
        return handleApiError(error, 'Failed to create book', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}