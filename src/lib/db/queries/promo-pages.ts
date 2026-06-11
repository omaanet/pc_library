// src/lib/db/queries/promo-pages.ts
// CRUD operations for promo audio pages.

import type { PromoPage, PromoPageListItem } from '@/types';
import type { PromoTemplate } from '@/lib/promo-page-input';
import { getNeonClient } from '../client';
import { extractRows, getFirstRow } from '../utils';
import { slugify } from '@/lib/slug';

// Columns selected from promo_pages, aliased into the camelCase PromoPage shape.
const PROMO_PAGE_COLUMNS = `
    id,
    book_id AS "bookId",
    slug,
    media_id AS "mediaId",
    audio_length AS "audioLength",
    is_active AS "isActive",
    template,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
`;

/**
 * Get a promo page by its slug. Returns the record regardless of active state;
 * callers decide how to treat a disabled page (the public route 404s on it).
 */
export async function getPromoPageBySlug(slug: string): Promise<PromoPage | undefined> {
    const client = getNeonClient();
    const res = await client.query(
        `SELECT ${PROMO_PAGE_COLUMNS} FROM promo_pages WHERE slug = $1`,
        [slug]
    );
    return getFirstRow<PromoPage>(res) ?? undefined;
}

/**
 * Get a promo page by its primary key.
 */
export async function getPromoPageById(id: number): Promise<PromoPage | undefined> {
    const client = getNeonClient();
    const res = await client.query(
        `SELECT ${PROMO_PAGE_COLUMNS} FROM promo_pages WHERE id = $1`,
        [id]
    );
    return getFirstRow<PromoPage>(res) ?? undefined;
}

/**
 * List all promo pages with their linked book title, newest first.
 */
export async function getAllPromoPages(): Promise<PromoPageListItem[]> {
    const client = getNeonClient();
    const res = await client.query(
        `SELECT
            p.id,
            p.book_id AS "bookId",
            p.slug,
            p.media_id AS "mediaId",
            p.audio_length AS "audioLength",
            p.is_active AS "isActive",
            p.template,
            p.created_at AS "createdAt",
            p.updated_at AS "updatedAt",
            b.title AS "bookTitle"
        FROM promo_pages p
        LEFT JOIN books b ON b.id = p.book_id
        ORDER BY p.created_at DESC`
    );
    return extractRows<PromoPageListItem>(res);
}

/**
 * Generate a slug that does not collide with an existing promo page. Appends a
 * numeric suffix (-2, -3, ...) until a free slug is found.
 */
async function generateUniqueSlug(base: string): Promise<string> {
    const client = getNeonClient();
    const root = slugify(base) || 'promo';

    let candidate = root;
    let suffix = 1;

    // Loop until the candidate is unused. Bounded in practice by collision count.
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const existing = getFirstRow<{ id: number }>(
            await client.query('SELECT id FROM promo_pages WHERE slug = $1', [candidate])
        );
        if (!existing) return candidate;

        suffix += 1;
        candidate = `${root}-${suffix}`;
    }
}

/**
 * Create a promo page for a book. The slug is auto-generated from the book title
 * and made unique. Returns the created record.
 */
export async function createPromoPage(data: {
    bookId: string;
    mediaId: string | null;
    audioLength: number | null;
    isActive: boolean;
    template: PromoTemplate;
}): Promise<PromoPage | undefined> {
    const client = getNeonClient();

    // Derive the slug from the linked book's title.
    const bookRow = getFirstRow<{ title: string }>(
        await client.query('SELECT title FROM books WHERE id = $1', [data.bookId])
    );
    if (!bookRow) {
        throw new Error('Linked book not found');
    }

    const slug = await generateUniqueSlug(bookRow.title);

    const res = await client.query(
        `INSERT INTO promo_pages (book_id, slug, media_id, audio_length, is_active, template)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${PROMO_PAGE_COLUMNS}`,
        [data.bookId, slug, data.mediaId, data.audioLength, data.isActive, data.template]
    );
    return getFirstRow<PromoPage>(res) ?? undefined;
}

/**
 * Update a promo page's fields, including the linked book. When the linked book
 * changes, the slug is regenerated (uniquely) from the new book's title;
 * otherwise the existing slug is preserved so unrelated edits keep the URL stable.
 */
export async function updatePromoPage(
    id: number,
    data: {
        bookId: string;
        mediaId: string | null;
        audioLength: number | null;
        isActive: boolean;
        template: PromoTemplate;
    }
): Promise<PromoPage | undefined> {
    const client = getNeonClient();

    // Read the current row to detect whether the linked book is changing.
    const current = getFirstRow<{ bookId: string; slug: string }>(
        await client.query('SELECT book_id AS "bookId", slug FROM promo_pages WHERE id = $1', [id])
    );
    if (!current) return undefined;

    let slug = current.slug;
    if (data.bookId !== current.bookId) {
        const bookRow = getFirstRow<{ title: string }>(
            await client.query('SELECT title FROM books WHERE id = $1', [data.bookId])
        );
        if (!bookRow) {
            throw new Error('Linked book not found');
        }
        slug = await generateUniqueSlug(bookRow.title);
    }

    const res = await client.query(
        `UPDATE promo_pages
         SET book_id = $1,
             slug = $2,
             media_id = $3,
             audio_length = $4,
             is_active = $5,
             template = $6,
             updated_at = NOW()
         WHERE id = $7
         RETURNING ${PROMO_PAGE_COLUMNS}`,
        [data.bookId, slug, data.mediaId, data.audioLength, data.isActive, data.template, id]
    );
    return getFirstRow<PromoPage>(res) ?? undefined;
}

/**
 * Delete a promo page by id. Returns true if a row was removed.
 */
export async function deletePromoPage(id: number): Promise<boolean> {
    const client = getNeonClient();
    const res = await client.query(
        'DELETE FROM promo_pages WHERE id = $1 RETURNING id',
        [id]
    );
    return Array.isArray(res) ? res.length > 0 : false;
}
