// src/lib/db/index.ts
// Barrel export for database module

// Export database client
export { getNeonClient } from './client';

// Export types
export type { BookQueryOptions, PaginatedResult } from './types';

// Export utilities
export { getFirstRow, extractRows } from './utils';

// Export transaction utilities
export { beginTransaction, withTransaction, executeTransactionQueries } from './transaction';

// Export book queries
export {
    getAllBooksOptimized,
    getBookById,
    createBook,
    updateBook,
    deleteBook
} from './queries/books';

// Export audiobook queries
export {
    getAudioBookById,
    saveAudioBook,
    deleteAudioBook
} from './queries/audiobooks';
