import { getNeonClient } from '@/lib/db/client';
import { extractRows, getFirstRow } from '@/lib/db/utils';
import type { BookPreview, PreviewInput } from '@/types/book-preview';

const columns = `p.book_id AS "bookId", p.title,
    to_char(p.expected_publication_date, 'YYYY-MM-DD') AS "expectedPublicationDate",
    p.is_visible AS "isVisible", p.display_order AS "displayOrder",
    p.cover_source AS "coverSource", p.cover_path AS "coverPath",
    p.video_enabled AS "videoEnabled", p.video_playback_id AS "videoPlaybackId",
    p.video_title AS "videoTitle", p.video_viewer_uid AS "videoViewerUid", p.video_placement AS "videoPlacement",
    p.extract_enabled AS "extractEnabled", p.extract_source AS "extractSource",
    p.extract_html AS "extractHtml", p.extract_image_paths AS "extractImagePaths", b.cover_image AS "bookCover"`;

export async function getPublicPreviews(): Promise<BookPreview[]> {
    return extractRows(await getNeonClient().query<BookPreview>(
        `SELECT ${columns} FROM book_previews p JOIN books b ON b.id = p.book_id
         WHERE p.is_visible = true ORDER BY p.display_order ASC NULLS LAST, p.book_id ASC`));
}

export async function getBookPreview(bookId: string): Promise<BookPreview | null> {
    return getFirstRow(await getNeonClient().query<BookPreview>(
        `SELECT ${columns} FROM book_previews p JOIN books b ON b.id = p.book_id WHERE p.book_id = $1`, [bookId]));
}

// Exported statement also runs against disposable PostgreSQL in the invariant tests.
export const savePreviewSql = `INSERT INTO book_previews (
    book_id, title, expected_publication_date, is_visible, display_order, cover_source, cover_path,
    video_enabled, video_playback_id, video_title, video_viewer_uid, video_placement,
    extract_enabled, extract_source, extract_html, extract_image_paths
) VALUES ($1,$2,$3::date,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::text[])
ON CONFLICT (book_id) DO UPDATE SET
    title = EXCLUDED.title, expected_publication_date = EXCLUDED.expected_publication_date,
    is_visible = EXCLUDED.is_visible, display_order = EXCLUDED.display_order,
    cover_source = EXCLUDED.cover_source, cover_path = EXCLUDED.cover_path,
    video_enabled = EXCLUDED.video_enabled, video_playback_id = EXCLUDED.video_playback_id,
    video_title = EXCLUDED.video_title, video_viewer_uid = EXCLUDED.video_viewer_uid, video_placement = EXCLUDED.video_placement,
    extract_enabled = EXCLUDED.extract_enabled, extract_source = EXCLUDED.extract_source,
    extract_html = EXCLUDED.extract_html, extract_image_paths = EXCLUDED.extract_image_paths, updated_at = CURRENT_TIMESTAMP`;

export function previewParameters(bookId: string, p: PreviewInput) {
    return [bookId, p.title, p.expectedPublicationDate, p.isVisible, p.displayOrder, p.coverSource, p.coverPath,
        p.videoEnabled, p.videoPlaybackId, p.videoTitle, p.videoViewerUid, p.videoPlacement,
        p.extractEnabled, p.extractSource, p.extractHtml, p.extractImagePaths];
}

export async function saveBookPreview(bookId: string, preview: PreviewInput) {
    await getNeonClient().query(savePreviewSql, previewParameters(bookId, preview));
    return getBookPreview(bookId);
}
