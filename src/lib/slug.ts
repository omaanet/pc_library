// src/lib/slug.ts
// URL-safe slug generation. Uniqueness against existing records is handled in
// the query layer (see src/lib/db/queries/promo-pages.ts), not here.

/**
 * Convert an arbitrary string (e.g. a book title) into a browser-compatible,
 * SEO-friendly, URL-safe slug.
 *
 * - Strips accents/diacritics (so Italian titles map cleanly to ASCII)
 * - Lowercases
 * - Replaces any run of non-alphanumeric characters with a single hyphen
 * - Trims leading/trailing hyphens
 */
export function slugify(input: string): string {
    if (!input) return '';

    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // any non-alphanumeric run -> single hyphen
        .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}
