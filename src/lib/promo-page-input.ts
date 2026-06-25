// src/lib/promo-page-input.ts
// Shared request-body validation for promo page create/update API routes.

import { ApiError, HttpStatus } from '@/lib/api-error-handler';

/** Available public templates for a promo page. `classic` is the default. */
export const PROMO_TEMPLATES = ['classic', 'classic-green', 'modern'] as const;
export type PromoTemplate = (typeof PROMO_TEMPLATES)[number];
export const DEFAULT_PROMO_AUDIO_TYPE = 'Anteprima';

function isPromoTemplate(value: unknown): value is PromoTemplate {
    return typeof value === 'string' && (PROMO_TEMPLATES as readonly string[]).includes(value);
}

export interface ParsedPromoPageInput {
    bookId: string | null;
    mediaId: string | null;
    audioLength: number | null;
    isActive: boolean;
    template: PromoTemplate;
    publishingDateOverride: string | null;
    audioType: string;
}

function parseDateOnly(value: unknown): string | null {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    if (typeof value !== 'string') {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'publishingDateOverride must be a date string or null');
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'publishingDateOverride must use YYYY-MM-DD format');
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'publishingDateOverride must be a valid date');
    }

    return trimmed;
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

    const publishingDateOverride = parseDateOnly(data.publishingDateOverride);

    let audioType = DEFAULT_PROMO_AUDIO_TYPE;
    if (data.audioType !== undefined && data.audioType !== null) {
        if (typeof data.audioType !== 'string') {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'audioType must be a string');
        }
        const trimmed = data.audioType.trim();
        audioType = trimmed.length > 0 ? trimmed : DEFAULT_PROMO_AUDIO_TYPE;
    }

    return { bookId, mediaId, audioLength, isActive, template, publishingDateOverride, audioType };
}
