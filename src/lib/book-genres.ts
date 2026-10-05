import { z } from 'zod';

export const BOOK_GENRES = ['Racconti', 'Racconti per bambini'] as const;
export type BookGenre = typeof BOOK_GENRES[number];

export const bookGenresSchema = z.array(z.enum(BOOK_GENRES))
    .min(1, 'Seleziona almeno un genere')
    .refine(values => new Set(values).size === values.length, 'I generi non possono essere duplicati');

/** Legacy records and new forms default to Racconti; explicit invalid values fail. */
export function getBookGenres(value: unknown): BookGenre[] {
    return bookGenresSchema.parse(value === undefined ? ['Racconti'] : value);
}
