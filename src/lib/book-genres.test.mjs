import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { BOOK_GENRES, bookGenresSchema, getBookGenres } from './book-genres.ts';
import { bookFormSchema, getBookFormValues } from './book-form-values.ts';

test('genres default for new and legacy books and survive form reopening and cloning', () => {
    assert.deepEqual(getBookGenres(undefined), ['Racconti']);
    assert.deepEqual(getBookFormValues().genres, ['Racconti']);
    for (const genres of [['Racconti'], ['Racconti per bambini'], [...BOOK_GENRES]]) {
        const values = getBookFormValues({ title: 'Libro', genres });
        assert.deepEqual(bookFormSchema.parse(values).genres, genres);
        const reopened = getBookFormValues({ ...values, publishingDate: values.publishingDate.toISOString() });
        assert.deepEqual(reopened.genres, genres);
        assert.notEqual(reopened.genres, genres);
        const clone = getBookFormValues({ ...reopened, title: 'Libro (Cloned)' });
        assert.deepEqual(clone.genres, genres);
    }
});

test('explicit empty, unknown, null, duplicate and non-array genres are rejected', () => {
    for (const genres of [[], ['Romanzi'], null, ['Racconti', 'Racconti'], 'Racconti', ['Racconti', null]]) {
        assert.equal(bookGenresSchema.safeParse(genres).success, false);
        assert.equal(bookFormSchema.safeParse({ ...getBookFormValues(), title: 'Libro', genres }).success, false);
    }
});

test('migration backfills legacy books, is repeatable and enforces valid genre arrays', async () => {
    const db = new PGlite();
    try {
        await db.exec("CREATE TABLE books (id TEXT PRIMARY KEY, title TEXT); INSERT INTO books VALUES ('legacy', 'Libro');");
        const sql = await fs.readFile(new URL('../../scripts/migrations/20261005_add_book_genres.sql', import.meta.url), 'utf8');
        await db.exec(sql);
        assert.deepEqual((await db.query("SELECT genres FROM books WHERE id='legacy'")).rows[0].genres, ['Racconti']);
        await db.query('UPDATE books SET genres=$1 WHERE id=$2', [[...BOOK_GENRES], 'legacy']);
        await db.exec(sql);
        assert.deepEqual((await db.query("SELECT genres FROM books WHERE id='legacy'")).rows[0].genres, [...BOOK_GENRES]);
        await db.exec("INSERT INTO books (id) VALUES ('default');");
        assert.deepEqual((await db.query("SELECT genres FROM books WHERE id='default'")).rows[0].genres, ['Racconti']);
        for (const genres of [[], ['Romanzi'], null, ['Racconti', 'Racconti'], ['Racconti', null], [[...BOOK_GENRES]]]) {
            await assert.rejects(db.query('UPDATE books SET genres=$1 WHERE id=$2', [genres, 'legacy']));
        }
        await db.query('UPDATE books SET genres=$1 WHERE id=$2', [['Racconti per bambini'], 'legacy']);
        await db.query('UPDATE books SET title=$1 WHERE id=$2', ['Altro titolo', 'legacy']);
        assert.deepEqual((await db.query("SELECT genres FROM books WHERE id='legacy'")).rows[0].genres, ['Racconti per bambini']);
    } finally {
        await db.close();
    }
});
