import type { Book } from '../types';
import { serializeCsv } from './csv.js';

type CsvValue = string | number | boolean | null | undefined;

export type BooksLibrarySortField =
    | 'title'
    | 'publishingDate'
    | 'hasAudio'
    | 'isPreview'
    | 'isNew'
    | 'book_id'
    | 'displayOrder'
    | 'isReadingVisible'
    | 'isAudioVisible';

export type BooksLibrarySortDirection = 'asc' | 'desc';
export type IsBookNew = (book: Book) => boolean;

interface BooksLibraryViewOptions {
    searchTerm: string;
    showAudioOnly: boolean;
    sortField: BooksLibrarySortField;
    sortDirection: BooksLibrarySortDirection;
    isBookNew: IsBookNew;
}

const CSV_HEADERS: CsvValue[] = [
    'ID',
    'Title',
    'Published',
    'Audio',
    'Preview',
    'Is New',
    'Display order',
    'Reading visible',
    'Audio visible',
];

function compareBooleans(a: boolean, b: boolean): number {
    return Number(a) - Number(b);
}

function compareBooks(
    a: Book,
    b: Book,
    sortField: BooksLibrarySortField,
    isBookNew: IsBookNew
): number {
    switch (sortField) {
        case 'title':
            return a.title.localeCompare(b.title);
        case 'publishingDate':
            return new Date(a.publishingDate).getTime() - new Date(b.publishingDate).getTime();
        case 'hasAudio':
            return compareBooleans(a.hasAudio, b.hasAudio);
        case 'isPreview':
            return compareBooleans(Boolean(a.isPreview), Boolean(b.isPreview));
        case 'isNew':
            return compareBooleans(isBookNew(a), isBookNew(b));
        case 'book_id':
            return a.id.localeCompare(b.id);
        case 'displayOrder':
            return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
        case 'isReadingVisible':
            return compareBooleans(a.isReadingVisible, b.isReadingVisible);
        case 'isAudioVisible':
            return compareBooleans(
                a.hasAudio && a.isAudioVisible,
                b.hasAudio && b.isAudioVisible
            );
    }
}

export function getBooksLibraryRows(
    books: Book[],
    options: BooksLibraryViewOptions
): Book[] {
    const searchTerm = options.searchTerm.toLowerCase();

    return books
        .filter(book => {
            const title = (book.title || '').toLowerCase();
            const summary = (book.summary || '').toLowerCase();
            const matchesSearch =
                searchTerm === ''
                || title.includes(searchTerm)
                || summary.includes(searchTerm);
            const matchesAudio = !options.showAudioOnly || book.hasAudio;

            return matchesSearch && matchesAudio;
        })
        .sort((a, b) => {
            const comparison = compareBooks(a, b, options.sortField, options.isBookNew);
            return options.sortDirection === 'asc' ? comparison : -comparison;
        });
}

function toIsoDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
}

export function createBooksLibraryCsv(books: Book[], isBookNew: IsBookNew): string {
    const rows: CsvValue[][] = books.map(book => [
        book.id,
        book.title,
        toIsoDate(book.publishingDate),
        book.hasAudio,
        Boolean(book.isPreview),
        isBookNew(book),
        book.displayOrder,
        book.isReadingVisible,
        book.hasAudio && book.isAudioVisible,
    ]);

    return serializeCsv([CSV_HEADERS, ...rows]);
}

export function createBooksLibraryCsvFilename(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `books-library-${year}-${month}-${day}.csv`;
}
