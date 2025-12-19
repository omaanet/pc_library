// src/lib/db/queries/books.ts
// Book CRUD operations

import { Book, AudioBook } from '@/types';
import { getNeonClient } from '../client';
import { getFirstRow, extractRows } from '../utils';
import type { BookQueryOptions, PaginatedResult } from '../types';
import { SITE_CONFIG } from '@/config/site-config';

// Internal helper functions for audiobook operations
// These are duplicated from audiobooks.ts to avoid circular dependencies

/**
 * Internal: Get audiobook by book_id
 */
async function getAudioBookById(id: string): Promise<AudioBook | undefined> {
    const client = getNeonClient();
    const res = await client.query(
        `SELECT id, book_id, media_id, audio_length, publishing_date FROM audiobooks WHERE book_id = $1`,
        [id]
    );
    const audioBook = getFirstRow<AudioBook>(res);
    if (!audioBook) return undefined;
    return audioBook;
}

/**
 * Internal: Insert or update audiobook data (upsert by book_id)
 */
async function saveAudioBook(data: {
    book_id: string;
    media_id: string | null;
    audio_length: number | null;
    publishing_date: string | null;
}): Promise<boolean> {
    const client = getNeonClient();
    console.log('[saveAudioBook] data:', data);

    try {
        const updateRes = await client.query(
            `UPDATE audiobooks SET media_id = $1, audio_length = $2, publishing_date = $3, updated_at = NOW() WHERE book_id = $4 RETURNING book_id`,
            [data.media_id, data.audio_length, data.publishing_date, data.book_id]
        );

        console.log('[saveAudioBook] updateRes:', updateRes);

        const wasUpdated = Array.isArray(updateRes)
            ? updateRes.length > 0
            : updateRes?.rowCount > 0;

        if (!wasUpdated) {
            try {
                const insertRes = await client.query(
                    `INSERT INTO audiobooks (book_id, media_id, audio_length, publishing_date) 
                     VALUES ($1, $2, $3, $4) RETURNING book_id`,
                    [data.book_id, data.media_id, data.audio_length, data.publishing_date]
                );
                console.log('[saveAudioBook] insertRes:', insertRes);

                return Array.isArray(insertRes)
                    ? insertRes.length > 0
                    : insertRes?.rowCount > 0;
            } catch (insertError) {
                console.error('[saveAudioBook] Error inserting audiobook:', insertError);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('[saveAudioBook] Error saving audiobook:', error);
        return false;
    }
}

/**
 * Internal: Delete an audiobook by book_id
 */
async function deleteAudioBook(bookId: string): Promise<boolean> {
    if (!bookId) {
        throw new Error('Book ID is required');
    }

    const client = getNeonClient();

    try {
        const result = await client.query(
            'DELETE FROM audiobooks WHERE book_id = $1 RETURNING book_id',
            [bookId]
        );

        return Array.isArray(result) ? result.length > 0 : false;
    } catch (error) {
        console.error('Error deleting audiobook:', error);
        throw error;
    }
}

/**
 * Get all books with advanced filtering, sorting, and pagination
 * 
 * Sorting behavior:
 * - If `sortBy` is provided as an array or valid string, uses that for sorting
 * - If no `sortBy` is provided, uses the configurable default from `SITE_CONFIG.DEFAULT_SORT`
 * - All sorting respects the validated column whitelist for security
 * - Nullable columns (rating, publishing_date) automatically get NULLS LAST handling
 * 
 * @param options - Query options including filters, sorting, and pagination
 * @returns Paginated result with books and pagination metadata
 */
export async function getAllBooksOptimized(options: BookQueryOptions = {}): Promise<PaginatedResult<Book>> {
    const client = getNeonClient();
    const {
        search,
        hasAudio,
        sortBy = '',
        sortOrder = 'desc',
        page = SITE_CONFIG.PAGINATION.DEFAULT_PAGE,
        perPage = SITE_CONFIG.PAGINATION.DEFAULT_PER_PAGE,
        displayPreviews = 0,
        isVisible = 1
    } = options;

    // Start building the query parts
    const whereConditions: string[] = [];
    const params: any[] = [];

    // Handle visibility filter (using index on is_visible)
    if (isVisible !== undefined && isVisible !== -1) {
        whereConditions.push(`is_visible = $${params.length + 1}`);
        params.push(isVisible > 0 ? 1 : 0);
    }

    // Handle preview filtering (using hardcoded values since they're not params)
    if (displayPreviews === 0) {
        whereConditions.push('(is_preview IS NULL OR is_preview != 1)');
    } else if (displayPreviews === 1) {
        whereConditions.push('is_preview = 1');
    }

    // Handle search (using index on title + full text search on summary)
    if (search) {
        const searchParam = `%${search.toLowerCase()}%`;
        whereConditions.push(`(LOWER(title) LIKE $${params.length + 1} OR LOWER(summary) LIKE $${params.length + 2})`);
        params.push(searchParam, searchParam);
    }

    // Handle audio filter (using index on has_audio)
    if (hasAudio !== undefined) {
        whereConditions.push(`has_audio = $${params.length + 1}`);
        params.push(hasAudio ? 1 : 0);
    }

    // Construct WHERE clause if conditions exist
    const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    // Sorting - implement proper dynamic sorting using provided parameters
    let orderByClause = '';

    // Define valid sortable columns to prevent SQL injection
    const validColumns = [
        'id', 'title', 'publishing_date', 'summary',
        'has_audio', 'audio_length', 'extract', 'rating', 'is_preview',
        'created_at', 'updated_at', 'display_order', 'pages_count'
    ];

    if (Array.isArray(sortBy) && sortBy.length > 0) {
        // Handle array format: [['column', 'ASC'], ['column2', 'DESC']]
        const sortClauses = sortBy
            .filter(([col]: [string, string]) => validColumns.includes(col))
            .map(([col, dir]: [string, string]) => {
                const direction = dir?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
                // Add NULLS LAST for proper handling of nullable columns
                return col === 'rating' || col === 'publishing_date' ? `${col} ${direction} NULLS LAST` : `${col} ${direction}`;
            });

        orderByClause = sortClauses.length > 0 ? `ORDER BY ${sortClauses.join(', ')}` : 'ORDER BY publishing_date DESC NULLS LAST';
    } else if (typeof sortBy === 'string' && sortBy && validColumns.includes(sortBy)) {
        // Handle single column string format
        const direction = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        // Add NULLS LAST for proper handling of nullable columns like rating and publishing_date
        orderByClause = sortBy === 'rating' || sortBy === 'publishing_date'
            ? `ORDER BY ${sortBy} ${direction} NULLS LAST`
            : `ORDER BY ${sortBy} ${direction}`;
    } else {
        // Default sort: use configurable default from SITE_CONFIG
        // This allows changing the default sort behavior without modifying code
        const defaultSortClauses = SITE_CONFIG.DEFAULT_SORT
            .filter(([col]) => validColumns.includes(col as string))
            .map(([col, dir]) => {
                const column = col as string;
                const direction = dir?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
                // Add NULLS LAST for proper handling of nullable columns
                return column === 'rating' || column === 'publishing_date' 
                    ? `${column} ${direction} NULLS LAST` 
                    : `${column} ${direction}`;
            });
        
        orderByClause = defaultSortClauses.length > 0 
            ? `ORDER BY ${defaultSortClauses.join(', ')}`
            : 'ORDER BY publishing_date DESC NULLS LAST'; // Final fallback if config is invalid
    }

    const newPriorityClause = `CASE WHEN publishing_date::timestamptz <= NOW() AND publishing_date::timestamptz >= NOW() - INTERVAL '${SITE_CONFIG.BOOK_BADGES.NEW_DAYS} days' THEN 1 ELSE 0 END DESC`;
    if (orderByClause.startsWith('ORDER BY ')) {
        orderByClause = `ORDER BY ${newPriorityClause}, ${orderByClause.slice('ORDER BY '.length)}`;
    }

    // Pagination
    const offset = (page - 1) * perPage;
    const limitClause = perPage > 0 ? `LIMIT $${params.length + 1} OFFSET $${params.length + 2}` : '';
    if (perPage > 0) {
        params.push(perPage, offset);
    }

    // Count query - use a copy of params without pagination params
    const countQueryParams = perPage > 0 ? params.slice(0, -2) : params;
    const countRes = await client.query(
        `SELECT COUNT(*) AS total FROM books ${whereClause}`,
        countQueryParams
    );

    // Get total count from result (handle both array and object formats)
    let total = 0;
    const countRow = getFirstRow(countRes);
    total = countRow?.total ? parseInt(countRow.total, 10) : 0;

    // Data query
    const dataQuery = `SELECT 
            id,
            title,
            cover_image as "coverImage",
            publishing_date as "publishingDate",
            summary,
            has_audio as "hasAudio",
            audio_length as "audioLength",
            extract,
            rating,
            is_preview as "isPreview",
            display_order as "displayOrder",
            is_visible as "isVisible",
            created_at as "createdAt",
            updated_at as "updatedAt",
            pages_count as "pagesCount",
            media_id as "mediaId",
            media_title as "mediaTitle",
            media_uid as "mediaUid",
            preview_placement as "previewPlacement"
        FROM books ${whereClause} ${orderByClause} ${limitClause}`;
    const dataRes = await client.query(
        dataQuery,
        params
    );

    // Handle both response formats robustly using extractRows utility
    const books = extractRows<Book>(dataRes);

    const result = {
        data: books,
        pagination: {
            total,
            page,
            perPage,
            totalPages: perPage > 0 ? Math.ceil(total / perPage) : 1,
        },
    };

    return result;
}

/**
 * Get a book by ID
 */
export async function getBookById(id: string): Promise<Book | undefined> {
    const client = getNeonClient();
    const res = await client.query(
        `SELECT 
            id,
            title,
            cover_image as "coverImage",
            publishing_date as "publishingDate",
            summary,
            has_audio as "hasAudio",
            audio_length as "audioLength",
            extract,
            rating,
            is_preview as "isPreview",
            is_visible as "isVisible",
            display_order as "displayOrder",
            created_at as "createdAt",
            updated_at as "updatedAt",
            pages_count as "pagesCount",
            media_id as "mediaId",
            media_title as "mediaTitle",
            media_uid as "mediaUid",
            preview_placement as "previewPlacement"
        FROM books WHERE id = $1`,
        [id]
    );
    const book = getFirstRow<Book>(res);
    if (!book) return undefined;

    // If the book has audio, fetch the audiobook information
    if (book.hasAudio) {
        const audioBook = await getAudioBookById(id);
        if (audioBook) {
            book.audiobook = {
                mediaId: audioBook.media_id
            };
            console.log('[getBookById] Populated audiobook data:', book.audiobook);
        }
    }

    return {
        ...book,
        hasAudio: book.hasAudio,
        isPreview: book.isPreview,
    };
}

/**
 * Create a new book
 * @returns Promise<{id: string} | null> - The ID of the created book, or null if creation failed
 */
export async function createBook(book: Omit<Book, 'id'>): Promise<{ id: string } | null> {
    const client = getNeonClient();
    // Generate ID in format 'book-{timestamp}'
    // Using performance.now() for higher resolution timestamp if available
    const timestamp = typeof performance !== 'undefined'
        ? Math.floor(performance.timeOrigin + performance.now())
        : Date.now();
    const id = `book-${timestamp}`;

    try {
        // First, insert the book
        const result = await client.query(
            `INSERT INTO books (
                id, title, cover_image, publishing_date, summary,
                has_audio, audio_length, extract, rating,
                is_preview, display_order, is_visible, pages_count,
                media_id, media_title, media_uid, preview_placement
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9,
                $10, $11, $12, $13,
                $14, $15, $16, $17
            )
            RETURNING id`,
            [
                id,
                book.title,
                book.coverImage,
                book.publishingDate,
                book.summary,
                book.hasAudio ? 1 : 0,
                book.audioLength || null,
                book.extract || null,
                book.rating || null,
                book.isPreview ? 1 : null,
                book.displayOrder || null,
                book.isVisible ? 1 : 0,
                book.pagesCount || null,
                book.mediaId || null,
                book.mediaTitle || null,
                book.mediaUid || null,
                book.previewPlacement || null
            ]
        );

        // If the book has audio, create/update the audiobook record
        if (book.hasAudio) {
            const mediaId = book.audiobook?.mediaId || null;
            const audioLength = book.audioLength || null; // audioLength is directly on book object

            if (mediaId !== null || audioLength !== null) {
                await saveAudioBook({
                    book_id: id,
                    media_id: mediaId,
                    audio_length: audioLength,
                    publishing_date: book.publishingDate || null
                });
            }
        }

        // Check if the insert was successful
        const wasInserted = Array.isArray(result)
            ? result.length > 0
            : result?.rowCount > 0;

        return wasInserted ? { id } : null;
    } catch (error) {
        console.error('[createBook] Error creating book:', error);
        return null;
    }
}

/**
 * Update an existing book
 */
export async function updateBook(id: string, book: Partial<Omit<Book, 'id'>>): Promise<boolean> {
    const client = getNeonClient();
    // Build the SET part of the query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    if (book.title !== undefined) {
        updates.push('title = $' + (updates.length + 1));
        values.push(book.title);
    }
    if (book.coverImage !== undefined) {
        updates.push('cover_image = $' + (updates.length + 1));
        values.push(book.coverImage);
    }
    if (book.publishingDate !== undefined) {
        updates.push('publishing_date = $' + (updates.length + 1));
        values.push(book.publishingDate);
    }
    if (book.summary !== undefined) {
        updates.push('summary = $' + (updates.length + 1));
        values.push(book.summary);
    }
    if (book.hasAudio !== undefined) {
        updates.push('has_audio = $' + (updates.length + 1));
        values.push(book.hasAudio ? 1 : 0);
    }
    if (book.audioLength !== undefined) {
        updates.push('audio_length = $' + (updates.length + 1));
        values.push(book.audioLength);
    }
    if (book.extract !== undefined) {
        updates.push('extract = $' + (updates.length + 1));
        values.push(book.extract);
    }
    if (book.rating !== undefined) {
        updates.push('rating = $' + (updates.length + 1));
        values.push(book.rating);
    }
    if (book.isPreview !== undefined) {
        updates.push('is_preview = $' + (updates.length + 1));
        values.push(book.isPreview ? 1 : 0);
    }
    if (book.isVisible !== undefined) {
        updates.push('is_visible = $' + (updates.length + 1));
        values.push(book.isVisible ? 1 : 0);
    }
    if (book.displayOrder !== undefined) {
        updates.push('display_order = $' + (updates.length + 1));
        values.push(book.displayOrder);
    }
    if (book.pagesCount !== undefined) {
        updates.push('pages_count = $' + (updates.length + 1));
        values.push(book.pagesCount);
    }
    if (book.mediaId !== undefined) {
        updates.push('media_id = $' + (updates.length + 1));
        values.push(book.mediaId);
    }
    if (book.mediaTitle !== undefined) {
        updates.push('media_title = $' + (updates.length + 1));
        values.push(book.mediaTitle);
    }
    if (book.mediaUid !== undefined) {
        updates.push('media_uid = $' + (updates.length + 1));
        values.push(book.mediaUid);
    }
    if (book.previewPlacement !== undefined) {
        updates.push('preview_placement = $' + (updates.length + 1));
        values.push(book.previewPlacement);
    }
    if (updates.length === 0) {
        return false; // Nothing to update
    }
    // Add updated_at timestamp
    updates.push('updated_at = NOW()');
    // Add the id to the values array
    values.push(id);
    // Build SQL with RETURNING to get affected rows
    const sql = `UPDATE books SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING id`;

    // Handle audiobook updates if needed
    if (book.hasAudio !== undefined || book.audiobook !== undefined || book.audioLength !== undefined) {
        const audioBook = await getAudioBookById(id);
        const currentBook = await getBookById(id);
        console.log('[updateBook] *** audioBook:', audioBook);
        if (book.hasAudio) {
            // Update or create audiobook record
            const mediaId = book.audiobook?.mediaId !== undefined
                ? book.audiobook.mediaId
                : (audioBook?.media_id || null);

            const audioLength = book.audioLength !== undefined
                ? book.audioLength
                : (audioBook?.audio_length || null); // audioLength is directly on book object

            if (mediaId !== null || audioLength !== null) {
                console.log('[updateBook] saving audiobook for book:', id);
                await saveAudioBook({
                    book_id: id,
                    media_id: mediaId,
                    audio_length: audioLength,
                    publishing_date: book.publishingDate || (currentBook?.publishingDate || null)
                });
            }
        } else if (audioBook) {
            // If hasAudio is being set to false, delete the audiobook record
            await deleteAudioBook(id);
        }
    }
    console.log('[updateBook] values:', values);
    console.log('[updateBook] SQL:', sql);

    // Execute the update query
    const result = await client.query(sql, values);
    console.log('[updateBook] Update result:', result);

    // Handle both array and object result formats
    // For Neon/Postgres, result could be an array or an object with rowCount
    const wasUpdated = Array.isArray(result)
        ? result.length > 0
        : result?.rowCount > 0;
    console.log('[updateBook] wasUpdated:', wasUpdated);

    return wasUpdated;
}

/**
 * Delete a book by ID
 * @param id - The ID of the book to delete
 * @returns Promise<boolean> - True if the book was deleted, false if no book was found with the given ID
 * @throws {Error} If there's an error executing the delete operation
 */
export async function deleteBook(id: string): Promise<boolean> {
    if (!id) {
        throw new Error('Book ID is required');
    }

    const client = getNeonClient();

    try {
        // Execute the delete query with RETURNING to confirm the deletion
        const result = await client.query(
            'DELETE FROM books WHERE id = $1 RETURNING id',
            [id]
        );

        // Check if any rows were affected
        const wasDeleted = Array.isArray(result)
            ? result.length > 0
            : result?.rowCount > 0;

        if (!wasDeleted) {
            console.log(`[deleteBook] No book found with ID: ${id}`);
        } else {
            console.log(`[deleteBook] Successfully deleted book with ID: ${id}`);
        }

        return wasDeleted;
    } catch (error) {
        console.error(`[deleteBook] Error deleting book with ID ${id}:`, error);
        throw new Error(`Failed to delete book: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
