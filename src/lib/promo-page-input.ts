// src/lib/promo-page-input.ts
// Shared request-body validation for promo page create/update API routes.

import { ApiError, HttpStatus } from '@/lib/api-error-handler';

/** Available public templates for a promo page. `classic` is the default. */
export const PROMO_TEMPLATES = ['classic', 'classic-green', 'modern'] as const;
export type PromoTemplate = (typeof PROMO_TEMPLATES)[number];

function isPromoTemplate(value: unknown): value is PromoTemplate {
    return typeof value === 'string' && (PROMO_TEMPLATES as readonly string[]).includes(value);
}

export interface ParsedPromoPageInput {
    bookId: string | null;
    mediaId: string | null;
    audioLength: number | null;
    isActive: boolean;
    template: PromoTemplate;
}

/**
 * Validate and normalize a promo page request body. Shared by POST (create) and
 * PUT (update); when requireBookId is false, bookId is ignored.
 */
export function parsePromoPageBody(
    body: unknown,
    options: { requireBookId: boolean }
): ParsedPromoPageInput {
    if (!body || typeof body !== 'object') {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid request body');
    }

    const data = body as Record<string, unknown>;

    let bookId: string | null = null;
    if (options.requireBookId) {
        if (typeof data.bookId !== 'string' || data.bookId.trim().length === 0) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'bookId is required');
        }
        bookId = data.bookId.trim();
    }

    let mediaId: string | null = null;
    if (data.mediaId !== undefined && data.mediaId !== null) {
        if (typeof data.mediaId !== 'string') {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'mediaId must be a string');
        }
        const trimmed = data.mediaId.trim();
        mediaId = trimmed.length > 0 ? trimmed : null;
    }

    let audioLength: number | null = null;
    if (data.audioLength !== undefined && data.audioLength !== null && data.audioLength !== '') {
        const value = Number(data.audioLength);
        if (!Number.isFinite(value) || value <= 0) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'audioLength must be a positive number');
        }
        audioLength = Math.floor(value);
    }

    const isActive = data.isActive === undefined ? true : Boolean(data.isActive);

    let template: PromoTemplate = 'classic';
    if (data.template !== undefined && data.template !== null) {
        if (!isPromoTemplate(data.template)) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid template');
        }
        template = data.template;
    }

    return { bookId, mediaId, audioLength, isActive, template };
}
