// src/types/images.ts
export interface ImageSize {
    width: number;
    height: number;
}

export interface BookCoverSizes {
    grid: ImageSize;
    list: ImageSize;
    detail: ImageSize;
}

export const DEFAULT_COVER_SIZES: BookCoverSizes = {
    grid: {
        width: 240,
        height: 360
    },
    list: {
        width: 96,
        height: 128
    },
    detail: {
        width: 400,
        height: 600
    }
} as const;

/**
 * Returns the appropriate sizes attribute for responsive images
 * based on the view type.
 */
export function getImageSizeString(size: keyof BookCoverSizes): string {
    switch (size) {
        case 'grid':
            return '(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw';
        case 'list':
            return '96px';
        case 'detail':
            return '(min-width: 768px) 33vw, 100vw';
    }
}