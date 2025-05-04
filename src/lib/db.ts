// src/lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';
import { AudioBook, Book } from '@/types';

// Define types for the enhanced book query options
export interface BookQueryOptions {
    search?: string;
    hasAudio?: boolean;
    sortBy?: Array<[string, 'ASC' | 'DESC']> | string;
    sortOrder?: 'asc' | 'desc'; // Only used if sortBy is a string
    page?: number;
    perPage?: number;
    displayPreviews?: number; // -1: all, 0: non-preview only, 1: preview only
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

// Database singleton
let db: Database.Database | null = null;

/**
 * Get a connection to the SQLite database
 */
export function getDb(): Database.Database {
    if (!db) {
        const dbPath = path.resolve(process.cwd(), 'db', 'books.db3');
        db = new Database(dbPath, { verbose: console.log });
    }
    return db;
}

/**
 * Get all books from the database
 * @deprecated Use getAllBooksOptimized instead for better performance with filtering
 */
export function getAllBooks(displayPreviews: number): Book[] {
    const db = getDb();

    let query = `
        SELECT 
            id, 
            title, 
            cover_image as coverImage, 
            publishing_date as publishingDate, 
            summary, 
            has_audio as hasAudio, 
            audio_length as audioLength,
            extract,
            rating,
            is_preview as isPreview,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM books
    `;

    // Apply filtering based on displayPreviews parameter
    if (displayPreviews === 0) {
        query += ` WHERE is_preview IS NULL OR is_preview != 1`;
    } else if (displayPreviews === 1) {
        query += ` WHERE is_preview = 1`;
    }
    // If displayPreviews is -1, no filter is applied (get all books)

    query += `;`;

    const books = db.prepare(query).all() as Book[];

    return books.map((book) => ({
        id: book.id,
        title: book.title,
        coverImage: book.coverImage,
        publishingDate: book.publishingDate,
        summary: book.summary,
        hasAudio: Boolean(book.hasAudio),
        audioLength: book.audioLength,
        extract: book.extract,
        rating: book.rating,
        isPreview: Boolean(book.isPreview),
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
    } as Book));
}

/**
 * Get books from the database with optimized filtering, search, sorting, and pagination
 * directly using SQL queries instead of JavaScript operations.
 */
export function getAllBooksOptimized(options: BookQueryOptions = {}): PaginatedResult<Book> {
    const db = getDb();
    const {
        search,
        hasAudio,
        sortBy = '', // Default to recent books
        sortOrder = 'desc', // Default to descending order (newest/highest first)
        page = 1,
        perPage = 10,
        displayPreviews = 0 // Default to non-preview books (0)
    } = options;

    // Start building the query parts
    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    // Handle preview filtering
    if (displayPreviews === 0) {
        whereConditions.push('(is_preview IS NULL OR is_preview != 1)');
    } else if (displayPreviews === 1) {
        whereConditions.push('is_preview = 1');
    }

    // Handle search (using index on title + full text search on summary)
    if (search) {
        const searchParam = `%${search.toLowerCase()}%`;
        whereConditions.push('(LOWER(title) LIKE ? OR LOWER(summary) LIKE ?)');
        queryParams.push(searchParam, searchParam);
    }

    // Handle audio filter (using index on has_audio)
    if (hasAudio !== undefined) {
        whereConditions.push('has_audio = ?');
        queryParams.push(hasAudio ? 1 : 0);
    }

    // Construct WHERE clause if conditions exist
    const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    // Generate ORDER BY clause
    // let orderByClause: string;

    // Handle array of sorting criteria
    // if (Array.isArray(sortBy)) {
    //     // Build compound sorting from array of [column, direction] pairs
    //     // Handle potential SQL injection by validating column names against DB schema
    //     const validColumns = [
    //         'id', 'title', 'cover_image', 'publishing_date', 'summary',
    //         'has_audio', 'audio_length', 'extract', 'rating', 'is_preview',
    //         'created_at', 'updated_at', "order"
    //     ];

    //     const sortClauses = sortBy.map(([column, direction]) => {
    //         // Validate column name is safe
    //         if (!validColumns.includes(column)) {
    //             // Default to title if invalid column
    //             // column = 'title';
    //             return;
    //         }

    //         // Validate direction is safe
    //         const safeDirection = direction === 'ASC' ? 'ASC' : 'DESC';

    //         // Handle NULLS LAST for ratings
    //         const nullsClause = column === 'rating' ? ' NULLS LAST' : '';

    //         return `${column} ${safeDirection}${nullsClause}`;
    //     });

    //     orderByClause = sortClauses.join(', ');
    // } else {
    //     // Handle string-based sortBy for backward compatibility
    //     const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';

    //     // Special sort modes
    //     if (sortBy === 'recent') {
    //         orderByClause = `publishing_date ${direction}`;
    //     } else if (sortBy === 'top_rated') {
    //         orderByClause = `rating ${direction} NULLS LAST, title ASC`;
    //     } else {
    //         // Convert from JavaScript property names to DB column names
    //         let column: string;
    //         switch (sortBy) {
    //             case 'coverImage': column = 'cover_image'; break;
    //             case 'publishingDate': column = 'publishing_date'; break;
    //             case 'hasAudio': column = 'has_audio'; break;
    //             case 'audioLength': column = 'audio_length'; break;
    //             case 'isPreview': column = 'is_preview'; break;
    //             case 'createdAt': column = 'created_at'; break;
    //             case 'updatedAt': column = 'updated_at'; break;
    //             default: column = sortBy as string || 'title';
    //         }

    //         orderByClause = `${column} ${direction}`;
    //     }
    // }

    // const direction = sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const orderByClause = `[has_audio] ASC, [order] ASC`;

    // console.log('orderByClause:', orderByClause);

    // First query: Get total count for pagination info
    const countQuery = `
        SELECT COUNT(*) as total
        FROM books
        ${whereClause}
    `;

    const { total } = db.prepare(countQuery).get(...queryParams) as { total: number };

    // Determine if pagination should be applied
    const shouldPaginate = perPage > 0;

    // Build data query
    let dataQuery = `
        SELECT 
            id, 
            title, 
            cover_image as coverImage, 
            publishing_date as publishingDate, 
            summary, 
            has_audio as hasAudio, 
            audio_length as audioLength,
            extract,
            rating,
            is_preview as isPreview,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM books
        ${whereClause}
        ORDER BY ${orderByClause}
    `;

    // Only add pagination if perPage > 0
    let allParams = [...queryParams];

    if (shouldPaginate) {
        // Calculate pagination values
        const offset = (page - 1) * perPage;
        dataQuery += ` LIMIT ? OFFSET ?`;
        allParams = [...queryParams, perPage, offset];
    }


    // if (displayPreviews === 1) {
    //     // console.log('##### >>>>> displayPreviews === 1', dataQuery);
    //     // return {
    //     //     data: [],
    //     //     pagination: {
    //     //         total: 0,
    //     //         page: 1,
    //     //         perPage: shouldPaginate ? perPage : 0,
    //     //         totalPages: 1,
    //     //     }
    //     // };
    // }


    // Execute the data query with parameters
    const books = db.prepare(dataQuery).all(...allParams) as Book[];

    // Process boolean values and return the result
    const processedBooks = books.map((book) => ({
        id: book.id,
        title: book.title,
        coverImage: book.coverImage,
        publishingDate: book.publishingDate,
        summary: book.summary,
        hasAudio: Boolean(book.hasAudio),
        audioLength: book.audioLength,
        extract: book.extract,
        rating: book.rating,
        isPreview: Boolean(book.isPreview),
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
    } as Book));

    // Return the result (paginated or not)
    return {
        data: processedBooks,
        pagination: {
            total,
            page: shouldPaginate ? page : 1,
            perPage: shouldPaginate ? perPage : total,
            totalPages: shouldPaginate ? Math.ceil(total / perPage) : 1,
        }
    };
}

/**
 * Get a book by ID
 */
export function getBookById(id: string): Book | undefined {
    const db = getDb();
    const book = db.prepare(`
        SELECT 
            id, 
            title, 
            cover_image as coverImage, 
            publishing_date as publishingDate, 
            summary, 
            has_audio as hasAudio, 
            audio_length as audioLength,
            extract,
            rating,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM books
        WHERE id = ?;
    `).get(id) as Book;

    if (!book) return undefined;

    return {
        id: book.id,
        title: book.title,
        coverImage: book.coverImage,
        publishingDate: book.publishingDate,
        summary: book.summary,
        hasAudio: Boolean(book.hasAudio),
        audioLength: book.audioLength,
        extract: book.extract,
        rating: book.rating,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
    } as Book;
}

/**
 * Get audiobook by book_id
 */
export function getAudioBookById(id: string): AudioBook | undefined {
    const db = getDb();
    const audiobook = db.prepare(`
        SELECT 
            id,
            book_id,
            media_id,
            audio_length,
            publishing_date
        FROM audiobooks 
        WHERE book_id = ?;
    `).get(id) as AudioBook;
    return audiobook;
}

/**
 * Insert or update audiobook data (upsert by book_id)
 */
export function saveAudioBook(data: {
    book_id: string;
    media_id: string | null;
    audio_length: number | null;
    publishing_date: string | null;
}): AudioBook | undefined {
    const db = getDb();
    // Try update first for minimal allocations
    const update = db.prepare(`
        UPDATE audiobooks
        SET media_id = ?, audio_length = ?, publishing_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE book_id = ?
    `);
    const result = update.run(
        data.media_id,
        data.audio_length,
        data.publishing_date,
        data.book_id
    );
    if (result.changes === 0) {
        // If nothing updated, insert
        db.prepare(`
            INSERT INTO audiobooks (book_id, media_id, audio_length, publishing_date)
            VALUES (?, ?, ?, ?)
        `).run(
            data.book_id,
            data.media_id,
            data.audio_length,
            data.publishing_date
        );
    }
    return getAudioBookById(data.book_id);
}

/**
 * Create a new book
 */
export function createBook(book: Omit<Book, 'id'>): Book {
    const db = getDb();
    const id = `book-${Date.now()}`;

    db.prepare(`
        INSERT INTO books (
            id, 
            title, 
            cover_image, 
            publishing_date, 
            summary, 
            has_audio, 
            audio_length,
            extract,
            rating,
            is_preview
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        id,
        book.title,
        book.coverImage,
        book.publishingDate,
        book.summary,
        book.hasAudio ? 1 : 0,
        book.audioLength || null,
        book.extract || null,
        book.rating || null,
        book.isPreview ? 1 : null
    );

    return {
        ...book,
        id,
    };
}

/**
 * Update an existing book
 */
export function updateBook(id: string, book: Partial<Omit<Book, 'id'>>): boolean {
    const db = getDb();

    // Build the SET part of the query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (book.title !== undefined) {
        updates.push('title = ?');
        values.push(book.title);
    }

    if (book.coverImage !== undefined) {
        updates.push('cover_image = ?');
        values.push(book.coverImage);
    }

    if (book.publishingDate !== undefined) {
        updates.push('publishing_date = ?');
        values.push(book.publishingDate);
    }

    if (book.summary !== undefined) {
        updates.push('summary = ?');
        values.push(book.summary);
    }

    if (book.hasAudio !== undefined) {
        updates.push('has_audio = ?');
        values.push(book.hasAudio ? 1 : 0);
    }

    if (book.audioLength !== undefined) {
        updates.push('audio_length = ?');
        values.push(book.audioLength || null);
    }

    if (book.extract !== undefined) {
        updates.push('extract = ?');
        values.push(book.extract || null);
    }

    if (book.rating !== undefined) {
        updates.push('rating = ?');
        values.push(book.rating || null);
    }

    if (book.isPreview !== undefined) {
        updates.push('is_preview = ?');
        values.push(book.isPreview ? 1 : null);
    }

    // Add updated_at timestamp
    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length === 0) {
        return false; // Nothing to update
    }

    // Add the id to the values array
    values.push(id);

    const result = db.prepare(`
        UPDATE books
        SET ${updates.join(', ')}
        WHERE id = ?
    `).run(...values);

    return result.changes > 0;
}

/**
 * Delete a book by ID
 */
export function deleteBook(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM books WHERE id = ?').run(id);
    return result.changes > 0;
}
