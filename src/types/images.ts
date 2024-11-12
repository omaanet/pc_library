// src/types/images.ts

export interface BookCoverSizes {
    grid: {
        width: number;
        height: number;
    };
    list: {
        width: number;
        height: number;
    };
    detail: {
        width: number;
        height: number;
    };
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
};

export function getImageSizeProps(size: keyof BookCoverSizes) {
    const dimensions = DEFAULT_COVER_SIZES[size];
    return {
        width: dimensions.width,
        height: dimensions.height,
        sizes: getSizeString(size)
    };
}

function getSizeString(size: keyof BookCoverSizes): string {
    switch (size) {
        case 'grid':
            return '(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw';
        case 'list':
            return '96px';
        case 'detail':
            return '(min-width: 768px) 33vw, 100vw';
        default:
            return '100vw';
    }
}