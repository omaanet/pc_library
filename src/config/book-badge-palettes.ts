import type { BookBadgePalette } from '@/types/preferences';

export const DEFAULT_BOOK_BADGE_PALETTE: BookBadgePalette = 'gold';

export const BOOK_BADGE_PALETTES: ReadonlyArray<{
    value: BookBadgePalette;
    label: string;
}> = [
    { value: 'gold', label: 'Oro' },
    { value: 'ocean', label: 'Oceano' },
    { value: 'lagoon', label: 'Laguna' },
    { value: 'lavender', label: 'Lavanda' },
    { value: 'coral', label: 'Corallo' },
    { value: 'paper', label: 'Carta' },
];

export function isBookBadgePalette(value: unknown): value is BookBadgePalette {
    return BOOK_BADGE_PALETTES.some((palette) => palette.value === value);
}
