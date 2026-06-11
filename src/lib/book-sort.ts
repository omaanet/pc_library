export const BOOK_SORT_PRESETS = {
    MAIN_LIBRARY: 'main-library',
} as const;

export type BookSortPreset = typeof BOOK_SORT_PRESETS[keyof typeof BOOK_SORT_PRESETS];
export type BookSortClause = [string, 'ASC' | 'DESC'];

export function isBookSortPreset(value: string | null): value is BookSortPreset {
    return value === BOOK_SORT_PRESETS.MAIN_LIBRARY;
}

export function resolveBookSortPreset(preset: BookSortPreset): BookSortClause[] {
    switch (preset) {
        case BOOK_SORT_PRESETS.MAIN_LIBRARY:
            return [
                ['display_order', 'ASC'],
                ['publishing_date', 'DESC'],
            ];
    }
}
