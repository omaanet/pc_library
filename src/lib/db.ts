// src/lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';
import { Book } from '@/types';

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
 */
export function getAllBooks(): Book[] {
    const db = getDb();
    const books = db.prepare(`
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
        FROM books;
    `).all() as Book[];

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
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
    } as Book));
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
            rating
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        id,
        book.title,
        book.coverImage,
        book.publishingDate,
        book.summary,
        book.hasAudio ? 1 : 0,
        book.audioLength || null,
        book.extract || null,
        book.rating || null
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
