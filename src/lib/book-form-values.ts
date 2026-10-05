import * as z from 'zod';
import type { Book } from '@/types';
import { IMAGE_CONFIG } from '@/lib/image-utils';
import { bookGenresSchema, getBookGenres } from './book-genres';

// Form validation schema
export const bookFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    genres: bookGenresSchema.default(['Racconti']),
    coverImage: z.string().default(IMAGE_CONFIG.placeholder.token),
    pagesCount: z.number().int().min(1, 'Page count must be at least 1').nullable().optional(),
    replaceFirstPageWithCopyrightOverride: z.boolean().nullable().optional(),
    displayOrder: z.number().int().nullable().optional(),
    publishingDate: z.date({
        required_error: 'Publishing date is required',
    }),
    summary: z.string().nullable().optional(),
    hasAudio: z.boolean().default(false),
    audioLength: z.number().min(1).nullable().optional(),
    extract: z.string().nullable().optional(),
    rating: z.number().min(1).max(5).nullable().optional(),
    isPreview: z.boolean().default(false),
    isNew: z.boolean().default(false),
    isReadingVisible: z.boolean().default(true),
    isAudioVisible: z.boolean().default(false),
    // Audiobook specific fields
    audiobook: z.object({
        mediaId: z.string().nullable().optional(),
        introAudioOverride: z.boolean().default(false),
        introAudioTitle: z.string().nullable().optional(),
        introAudioId: z.string().nullable().optional()
    }).optional()
        .default({
            mediaId: null,
            introAudioOverride: false,
            introAudioTitle: null,
            introAudioId: null
        }),
    // Preview media fields (optional)
    mediaId: z.string().nullable().optional(),
    mediaTitle: z.string().nullable().optional(),
    mediaUid: z.string().nullable().optional(),
    previewPlacement: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
    if (!data.hasAudio || !data.audiobook?.introAudioOverride) {
        return;
    }

    if (!data.audiobook.introAudioTitle?.trim()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Title is required when intro override is enabled',
            path: ['audiobook', 'introAudioTitle']
        });
    }

    if (!data.audiobook.introAudioId?.trim()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'IntroAudioID is required when intro override is enabled',
            path: ['audiobook', 'introAudioId']
        });
    }
});

export type BookFormValues = z.infer<typeof bookFormSchema>;


/** Normalize the legacy database's numeric flags before strict form validation. */
export function getBookFormValues(book?: Partial<Book>): BookFormValues {
    const hasAudio = Boolean(book?.hasAudio);
    const legacyVisible = book?.isVisible !== undefined ? Boolean(book.isVisible) : true;
    return {
        title: book?.title || '',
        genres: getBookGenres(book?.genres),
        coverImage: book?.coverImage || IMAGE_CONFIG.placeholder.token,
        pagesCount: book?.pagesCount,
        replaceFirstPageWithCopyrightOverride: book?.replaceFirstPageWithCopyrightOverride == null
            ? null : Boolean(book.replaceFirstPageWithCopyrightOverride),
        displayOrder: book?.displayOrder ?? null,
        publishingDate: book?.publishingDate ? new Date(book.publishingDate) : new Date(),
        summary: book?.summary || '',
        hasAudio,
        audioLength: book?.audioLength,
        extract: book?.extract || '',
        rating: book?.rating,
        isPreview: Boolean(book?.isPreview),
        isNew: Boolean(book?.isNew),
        isReadingVisible: Boolean(book?.isReadingVisible ?? legacyVisible),
        isAudioVisible: hasAudio && Boolean(book?.isAudioVisible ?? legacyVisible),
        audiobook: {
            mediaId: book?.audiobook?.mediaId || null,
            introAudioOverride: Boolean(book?.audiobook?.introAudioOverride),
            introAudioTitle: book?.audiobook?.introAudioTitle ?? null,
            introAudioId: book?.audiobook?.introAudioId ?? null,
        },
        mediaId: book?.mediaId ?? null,
        mediaTitle: book?.mediaTitle ?? null,
        mediaUid: book?.mediaUid ?? '1',
        previewPlacement: book?.previewPlacement ?? null,
    };
}

/** Include nested and currently hidden fields, without traversing DOM refs. */
export function getBookFormErrorMessages(errors: unknown): string[] {
    if (!errors || typeof errors !== 'object') return [];
    const record = errors as Record<string, unknown>;
    if (typeof record.message === 'string') return [record.message];
    return [...new Set(Object.entries(record)
        .filter(([key]) => !['ref', 'type', 'types'].includes(key))
        .flatMap(([, value]) => getBookFormErrorMessages(value)))];
}
