import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createBooksLibraryCsv,
    createBooksLibraryCsvFilename,
    getBooksLibraryRows,
} from './books-library-csv.ts';
import { serializeCsv } from './csv.js';

const books = [
    {
        id: 'book-2',
        title: 'Beta, "Quoted"',
        publishingDate: '2025-02-03T12:00:00.000Z',
        summary: 'A matching summary',
        hasAudio: true,
        isPreview: false,
        isNew: false,
        displayOrder: undefined,
        isReadingVisible: false,
        isAudioVisible: true,
        coverImage: '',
    },
    {
        id: 'book-1',
        title: '=FORMULA()',
        publishingDate: '2024-01-02',
        summary: 'Other',
        hasAudio: false,
        isPreview: true,
        isNew: true,
        displayOrder: 4,
        isReadingVisible: true,
        isAudioVisible: true,
        coverImage: '',
    },
    {
        id: 'book-3',
        title: 'Alpha',
        publishingDate: '2026-04-05',
        summary: 'Match by title',
        hasAudio: true,
        isPreview: true,
        isNew: false,
        displayOrder: 2,
        isReadingVisible: true,
        isAudioVisible: false,
        coverImage: '',
    },
];

const isBookNew = book => Boolean(book.isNew);

test('CSV exports visible columns with ISO dates and effective boolean values', () => {
    const csv = createBooksLibraryCsv(books, isBookNew);
    const lines = csv.split('\r\n');

    assert.equal(
        lines[0],
        'ID,Title,Published,Audio,Preview,Is New,Display order,Reading visible,Audio visible'
    );
    assert.equal(
        lines[1],
        'book-2,"Beta, ""Quoted""",2025-02-03,true,false,false,,false,true'
    );
    assert.equal(
        lines[2],
        "book-1,'=FORMULA(),2024-01-02,false,true,true,4,true,false"
    );
});

test('CSV quotes commas, quotes, and line breaks', () => {
    assert.equal(
        serializeCsv([['comma,value', 'quote"value', 'line\nbreak']]),
        '"comma,value","quote""value","line\nbreak"'
    );
});

test('search and audio filters produce the exported table row set', () => {
    const filtered = getBooksLibraryRows(books, {
        searchTerm: 'match',
        showAudioOnly: true,
        sortField: 'title',
        sortDirection: 'asc',
        isBookNew,
    });

    assert.deepEqual(filtered.map(book => book.id), ['book-3', 'book-2']);
});

test('every supported sort field follows the requested direction', () => {
    const expectedByField = {
        title: {
            asc: ['book-1', 'book-3', 'book-2'],
            desc: ['book-2', 'book-3', 'book-1'],
        },
        publishingDate: {
            asc: ['book-1', 'book-2', 'book-3'],
            desc: ['book-3', 'book-2', 'book-1'],
        },
        hasAudio: {
            asc: ['book-1', 'book-2', 'book-3'],
            desc: ['book-2', 'book-3', 'book-1'],
        },
        isPreview: {
            asc: ['book-2', 'book-1', 'book-3'],
            desc: ['book-1', 'book-3', 'book-2'],
        },
        isNew: {
            asc: ['book-2', 'book-3', 'book-1'],
            desc: ['book-1', 'book-2', 'book-3'],
        },
        book_id: {
            asc: ['book-1', 'book-2', 'book-3'],
            desc: ['book-3', 'book-2', 'book-1'],
        },
        displayOrder: {
            asc: ['book-2', 'book-3', 'book-1'],
            desc: ['book-1', 'book-3', 'book-2'],
        },
        isReadingVisible: {
            asc: ['book-2', 'book-1', 'book-3'],
            desc: ['book-1', 'book-3', 'book-2'],
        },
        isAudioVisible: {
            asc: ['book-1', 'book-3', 'book-2'],
            desc: ['book-2', 'book-1', 'book-3'],
        },
    };

    for (const [sortField, expected] of Object.entries(expectedByField)) {
        const ascending = getBooksLibraryRows(books, {
            searchTerm: '',
            showAudioOnly: false,
            sortField,
            sortDirection: 'asc',
            isBookNew,
        });
        const descending = getBooksLibraryRows(books, {
            searchTerm: '',
            showAudioOnly: false,
            sortField,
            sortDirection: 'desc',
            isBookNew,
        });

        assert.deepEqual(ascending.map(book => book.id), expected.asc, `${sortField} asc`);
        assert.deepEqual(descending.map(book => book.id), expected.desc, `${sortField} desc`);
    }
});

test('CSV filename uses the local calendar date', () => {
    assert.equal(
        createBooksLibraryCsvFilename(new Date(2026, 5, 9)),
        'books-library-2026-06-09.csv'
    );
});
