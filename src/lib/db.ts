// src/lib/db.ts
// Neon/Postgres migration: remove SQLite dependencies
import { neon } from '@neondatabase/serverless';
// Only import Neon connection, not sql tagged template

import { AudioBook, Book } from '@/types';

// Get current environment
// const NODE_ENV = process.env.NODE_ENV || 'development';

// if (NODE_ENV === 'development') {
//     // Load environment variables from .env files
//     require('dotenv').config();
// }

// Neon connection string from environment variable
const connectionString = process.env.DATABASE_URL as string;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for Neon connection');
}

// Create a singleton Neon client (pool)
let neonClient: any = null;

export function getNeonClient(): any {
    if (!neonClient) {
        // Create the base Neon client
        neonClient = neon(connectionString);

        // Save the original query method
        const originalQuery = neonClient.query;

        // Override the query method with our debugging wrapper
        neonClient.query = async function (sql: string, params?: any[]) {
            // Log query info
            // console.debug('------ DATABASE QUERY -------');
            // console.debug('[Neon SQL] Query:', sql);
            // console.debug('[Neon SQL] Params:', params);

            try {
                // Call the original query method, preserving 'this' context
                const result = await originalQuery.call(this, sql, params);

                // Log result info
                // console.debug('[Neon SQL] Success! Rows:', result?.rows?.length || 0);
                if (result?.rows?.length > 0) {
                    // console.debug('[Neon SQL] First row:', JSON.stringify(result.rows[0]));
                }

                return result;
            } catch (error) {
                // Log error info
                console.error('[Neon SQL] Error executing query:', error);
                throw error;
            }
        };
    }

    return neonClient;
}

// Define types for the enhanced book query options
export interface BookQueryOptions {
    search?: string;
    hasAudio?: boolean;
    sortBy?: Array<[string, 'ASC' | 'DESC']> | string;
    sortOrder?: 'asc' | 'desc'; // Only used if sortBy is a string
    page?: number;
    perPage?: number;
    displayPreviews?: number; // -1: all, 0: non-preview only, 1: preview only
    displayOrder?: number;
    isVisible?: number;
}

// Define the pagination result type
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
    };
}

// --- Neon DB Connection ---
// Use getNeonClient() to get the Neon Postgres client for all DB operations.
// All queries are async and parameterized for safety.

/**
 * Extract first row from query result (handles both array and object formats)
 */
export function getFirstRow<T = any>(result: any): T | null {
    return (Array.isArray(result) ? result[0] : result?.rows?.[0]) || null;
}

/**
 * Utility to robustly extract rows from Neon/Postgres query results.
 * Handles both array and { rows: [...] } result shapes.
 */
export function extractRows<T = any>(res: any): T[] {
    if (Array.isArray(res)) {
        return res as T[];
    }
    if (res && Array.isArray(res.rows)) {
        return res.rows as T[];
    }
    console.error('[extractRows] Unexpected query result:', res);
    return [];
}

export async function getAllBooksOptimized(options: BookQueryOptions = {}): Promise<PaginatedResult<Book>> {
    // console.log('getAllBooksOptimized');
    const client = getNeonClient();
    const {
        search,
        hasAudio,
        sortBy = '',
        sortOrder = 'desc',
        page = 1,
        perPage = 10,
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

    // Sorting
    // let orderByClause = '';
    // if (Array.isArray(sortBy) && sortBy.length > 0) {
    //     const validColumns = [
    //         'id', 'title', 'cover_image', 'publishing_date', 'summary',
    //         'has_audio', 'audio_length', 'extract', 'rating', 'is_preview',
    //         'created_at', 'updated_at', 'display_order'
    //     ];
    //     const sortClauses = sortBy
    //         .filter(([col]: [string, string]) => validColumns.includes(col))
    //         .map(([col, dir]: [string, string]) => `${col} ${dir}`)
    //         .join(', ');
    //     orderByClause = sortClauses ? `ORDER BY ${sortClauses}` : 'ORDER BY publishing_date DESC NULLS LAST';
    // } else if (typeof sortBy === 'string' && sortBy) {
    //     orderByClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'} NULLS LAST`;
    // } else {
    //     // Default sort to newest books first
    //     orderByClause = 'ORDER BY publishing_date DESC NULLS LAST';
    // }

    const orderByClause = `ORDER BY has_audio ASC, display_order ASC`;

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
    const dataQuery = `SELECT id, title, cover_image as "coverImage", publishing_date as "publishingDate", summary, has_audio as "hasAudio", audio_length as "audioLength", extract, rating, is_preview as "isPreview", display_order as "displayOrder", is_visible as "isVisible", created_at as "createdAt", updated_at as "updatedAt", pages_count as "pagesCount" FROM books ${whereClause} ${orderByClause} ${limitClause}`;
    const dataRes = await client.query(
        dataQuery,
        params
    );

    // Extra debugging to troubleshoot data transformation
    // console.debug('============================================================');
    // console.debug('[Books Debug] SQL:', dataQuery);
    // console.debug('[Books Debug] Params:', orderByClause);
    // console.debug('[Books Debug] displayPreviews:', displayPreviews);
    // console.debug('[Books Debug] isVisible:', isVisible);

    // Handle both response formats robustly using extractRows utility
    const books = extractRows<Book>(dataRes);
    // console.debug('[Books Debug] Direct array length:', rowsData.length);
    if (books.length > 0) {
        // console.debug('[Books Debug] First row sample:', JSON.stringify(rowsData[0]));
    }

    // Map raw database records to Book objects with boolean conversions
    // const books = rowsData.length > 0 ? rowsData.map((book: Book) => {
    //     // Convert database integer values to booleans
    //     const transformedBook = {
    //         ...book,
    //         hasAudio: book.hasAudio,
    //         isPreview: book.isPreview,
    //         isVisible: book.isVisible
    //     };

    //     // if (rowsData.indexOf(book) === 0) {
    //     //     console.debug('[Books Debug] Transformed first book:', JSON.stringify(transformedBook));
    //     // }

    //     return transformedBook;
    // }) : [];

    // Final debug of result being returned
    // if (process.env.NODE_ENV === 'development') {
    //     console.debug('[Books Debug] Final books array length:', books.length);
    //     console.debug('[Books Debug] Pagination info:', JSON.stringify({
    //         total,
    //         page,
    //         perPage,
    //         totalPages: perPage > 0 ? Math.ceil(total / perPage) : 1
    //     }));
    // }

    const result = {
        data: books,
        pagination: {
            total,
            page,
            perPage,
            totalPages: perPage > 0 ? Math.ceil(total / perPage) : 1,
        },
    };

    // if (displayPreviews === 1) {
    //     console.debug('************************************************************************');
    //     console.debug('---->> result:', result);
    //     console.debug('************************************************************************');
    // }

    return result;
}

/**
 * Get a book by ID
 */
export async function getBookById(id: string): Promise<Book | undefined> {
    const client = getNeonClient();
    const res = await client.query(
        `SELECT id, title, cover_image as "coverImage", publishing_date as "publishingDate", summary, has_audio as "hasAudio", audio_length as "audioLength", extract, rating, is_preview as "isPreview", is_visible as "isVisible", display_order as "displayOrder", created_at as "createdAt", updated_at as "updatedAt", pages_count as "pagesCount" FROM books WHERE id = $1`,
        [id]
    );
    const book = getFirstRow<Book>(res);
    if (!book) return undefined;
    return {
        ...book,
        hasAudio: book.hasAudio,
        isPreview: book.isPreview,
    };
}

/**
 * Get audiobook by book_id
 */
export async function getAudioBookById(id: string): Promise<AudioBook | undefined> {
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
 * Insert or update audiobook data (upsert by book_id)
 */
export async function saveAudioBook(data: {
    book_id: string;
    media_id: string | null;
    audio_length: number | null;
    publishing_date: string | null;
}): Promise<AudioBook | undefined> {
    const client = getNeonClient();
    // Try update first
    const updateRes = await client.query(
        `UPDATE audiobooks SET media_id = $1, audio_length = $2, publishing_date = $3, updated_at = NOW() WHERE book_id = $4`,
        [data.media_id, data.audio_length, data.publishing_date, data.book_id]
    );
    if (updateRes.rowCount === 0) {
        // If nothing updated, insert
        await client.query(
            `INSERT INTO audiobooks (book_id, media_id, audio_length, publishing_date) VALUES ($1, $2, $3, $4)`,
            [data.book_id, data.media_id, data.audio_length, data.publishing_date]
        );
    }
    return getAudioBookById(data.book_id);
}

/**
 * Create a new book
 */
export async function createBook(book: Omit<Book, 'id'>): Promise<Book> {
    const client = getNeonClient();
    // Use gen_random_uuid() if available, otherwise fallback to uuid_generate_v4()
    const idRes = await client.query('SELECT gen_random_uuid() as id');
    const id = idRes.rows[0].id;
    await client.query(
        `INSERT INTO books (id, title, cover_image, publishing_date, summary, has_audio, audio_length, extract, rating, is_preview, display_order, is_visible, pages_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [id, book.title, book.coverImage, book.publishingDate, book.summary, book.hasAudio ? 1 : 0, book.audioLength || null, book.extract || null, book.rating || null, book.isPreview ? 1 : null, book.displayOrder || null, book.isVisible ? 1 : null, book.pagesCount || null]
    );
    return { ...book, id };
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
    if (updates.length === 0) {
        return false; // Nothing to update
    }
    // Add updated_at timestamp
    updates.push('updated_at = NOW()');
    // Add the id to the values array
    values.push(id);
    // Build SQL with RETURNING to get affected rows
    const sql = `UPDATE books SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING id`;
    // console.log('[updateBook] id:', id);
    // console.log('[updateBook] updates clauses:', updates);
    // console.log('[updateBook] SQL:', sql);
    // console.log('[updateBook] values:', values);
    // Neon serverless client returns an array of rows
    const rows = await client.query(sql, values);
    // console.log('[updateBook] result rows:', rows);
    return rows.length > 0;
}

/**
 * Delete a book by ID
 */
export async function deleteBook(id: string): Promise<boolean> {
    const client = getNeonClient();
    const res = await client.query('DELETE FROM books WHERE id = $1', [id]);
    return res.rowCount > 0;
}
