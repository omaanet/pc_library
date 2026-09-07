import { z } from 'zod';
import type { BookPreview, PreviewInput, PublicBookPreview } from '../types/book-preview';
import { hasPreviewText, sanitizePreviewHtml } from './preview-html';

export function safeAssetPath(value: string): boolean {
    return value.length > 0 && value.length <= 400 && !/[\\:%?#\x00-\x1f]/.test(value) &&
        value.split('/').every(part => !!part && part !== '.' && part !== '..' && !/[. ]$/.test(part));
}

export function isCalendarDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.slice(0, 4) === '0000') return false;
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const nullableText = z.string().max(500).nullable();
const assetPath = z.string().refine(safeAssetPath, 'Percorso immagine non valido');
export const previewSchema = z.object({
    title: z.string().trim().min(1, 'Inserisci il titolo').max(500),
    expectedPublicationDate: z.string().refine(isCalendarDate, 'Data non valida').nullable(),
    isVisible: z.boolean(),
    displayOrder: z.number().int().min(-2147483648).max(2147483647).nullable(),
    coverSource: z.enum(['preview', 'book']).nullable(),
    coverPath: assetPath.nullable(),
    videoEnabled: z.boolean(),
    videoPlaybackId: nullableText,
    videoTitle: nullableText,
    videoViewerUid: nullableText,
    videoPlacement: z.enum(['left', 'right']),
    extractEnabled: z.boolean(),
    extractSource: z.enum(['text', 'images']),
    extractHtml: z.string().max(200000).nullable(),
    extractImagePaths: z.array(assetPath).max(50),
}).superRefine((data, ctx) => {
    const error = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
    if ((data.coverSource === null) !== (data.coverPath === null)) error('coverPath', 'Scegli una copertina oppure usa quella del libro');
    if (data.videoEnabled && !data.videoPlaybackId?.trim()) error('videoPlaybackId', 'Inserisci il playback ID');
    if (data.extractEnabled && data.extractSource === 'text' && !hasPreviewText(data.extractHtml || '')) error('extractHtml', 'Inserisci un estratto HTML con testo');
    if (data.extractEnabled && data.extractSource === 'images' && !data.extractImagePaths.length) error('extractImagePaths', 'Seleziona almeno una pagina');
    if (new Set(data.extractImagePaths).size !== data.extractImagePaths.length) error('extractImagePaths', 'Le pagine non possono essere duplicate');
});

export function emptyPreview(title: string): PreviewInput {
    return { title, expectedPublicationDate: null, isVisible: false, displayOrder: null,
        coverSource: null, coverPath: null, videoEnabled: false, videoPlaybackId: null,
        videoTitle: null, videoViewerUid: null, videoPlacement: 'right', extractEnabled: false,
        extractSource: 'text', extractHtml: null, extractImagePaths: [] };
}

export function previewAssetUrl(source: 'preview' | 'book' | 'pages', relative: string, bookId?: string): string {
    const segments = source === 'pages' ? ['pages', bookId!, ...relative.split('/')] : [source, ...relative.split('/')];
    return '/api/preview-assets/' + segments.map(encodeURIComponent).join('/');
}

export function publicPreview(preview: BookPreview): PublicBookPreview {
    const fallback = preview.bookCover?.trim();
    const coverUrl = preview.coverSource && preview.coverPath
        ? previewAssetUrl(preview.coverSource, preview.coverPath)
        : fallback && fallback !== '@placeholder' && safeAssetPath(fallback) ? previewAssetUrl('book', fallback) : null;
    return {
        bookId: preview.bookId, title: preview.title, expectedPublicationDate: preview.expectedPublicationDate, coverUrl,
        video: preview.videoEnabled && preview.videoPlaybackId?.trim() ? {
            playbackId: preview.videoPlaybackId.trim(), title: preview.videoTitle || preview.title,
            viewerUid: preview.videoViewerUid, placement: preview.videoPlacement,
        } : null,
        extract: !preview.extractEnabled ? null : preview.extractSource === 'text'
            ? hasPreviewText(preview.extractHtml || '') ? { source: 'text', html: sanitizePreviewHtml(preview.extractHtml || '') } : null
            : preview.extractImagePaths.length ? { source: 'images', images: preview.extractImagePaths.map(p => previewAssetUrl('pages', p, preview.bookId)), pagesCount: preview.extractImagePaths.length } : null,
    };
}

export function publicationAnnouncement(date: string): string {
    return 'Pubblicazione sul sito entro il ' + new Intl.DateTimeFormat('it-IT', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
    }).format(new Date(`${date}T12:00:00Z`));
}
