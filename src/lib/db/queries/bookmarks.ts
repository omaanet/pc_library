import { getNeonClient } from '../client';
import { extractRows, getFirstRow } from '../utils';

export type BookmarkKind = 'reader' | 'audio';

export interface Bookmark {
    id: number;
    bookId: string;
    userId: number;
    kind: BookmarkKind;
    pageNumber: number | null;
    audioTimeSeconds: number | null;
    audioMediaId: string | null;
    createdAt: string;
    updatedAt: string;
}

interface DatabaseBookmark {
    id: number;
    bookId: string;
    userId: number;
    kind: BookmarkKind;
    pageNumber: number | null;
    audioTimeSeconds: number | null;
    audioMediaId: string | null;
    createdAt: string;
    updatedAt: string;
}

interface UpsertBookmarkInput {
    userId: number;
    bookId: string;
    kind: BookmarkKind;
    pageNumber?: number | null;
    audioTimeSeconds?: number | null;
    audioMediaId?: string | null;
}

export interface BookmarksByKind {
    reader: Bookmark | null;
    audio: Bookmark | null;
}

export async function getBookmarksForBook(userId: number, bookId: string): Promise<BookmarksByKind> {
    const client = getNeonClient();
    const result = await client.query<DatabaseBookmark>(
        `SELECT
            id,
            book_id as "bookId",
            user_id as "userId",
            kind,
            page_number as "pageNumber",
            audio_time_seconds as "audioTimeSeconds",
            audio_media_id as "audioMediaId",
            created_at as "createdAt",
            updated_at as "updatedAt"
        FROM bookmarks
        WHERE user_id = $1 AND book_id = $2`,
        [userId, bookId]
    );

    const bookmarks = extractRows<Bookmark>(result);

    return {
        reader: bookmarks.find((bookmark) => bookmark.kind === 'reader') ?? null,
        audio: bookmarks.find((bookmark) => bookmark.kind === 'audio') ?? null,
    };
}

export async function upsertBookmark(input: UpsertBookmarkInput): Promise<Bookmark> {
    const client = getNeonClient();
    const result = await client.query<DatabaseBookmark>(
        `INSERT INTO bookmarks (
            user_id,
            book_id,
            kind,
            page_number,
            audio_time_seconds,
            audio_media_id,
            created_at,
            updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (user_id, book_id, kind)
        DO UPDATE SET
            page_number = EXCLUDED.page_number,
            audio_time_seconds = EXCLUDED.audio_time_seconds,
            audio_media_id = EXCLUDED.audio_media_id,
            updated_at = NOW()
        RETURNING
            id,
            book_id as "bookId",
            user_id as "userId",
            kind,
            page_number as "pageNumber",
            audio_time_seconds as "audioTimeSeconds",
            audio_media_id as "audioMediaId",
            created_at as "createdAt",
            updated_at as "updatedAt"`,
        [
            input.userId,
            input.bookId,
            input.kind,
            input.pageNumber ?? null,
            input.audioTimeSeconds ?? null,
            input.audioMediaId ?? null,
        ]
    );

    const bookmark = getFirstRow<Bookmark>(result);
    if (!bookmark) {
        throw new Error('Failed to save bookmark');
    }

    return bookmark;
}

export async function deleteBookmark(userId: number, bookId: string, kind: BookmarkKind): Promise<boolean> {
    const client = getNeonClient();
    const result = await client.query<Pick<DatabaseBookmark, 'id'>>(
        `DELETE FROM bookmarks
        WHERE user_id = $1 AND book_id = $2 AND kind = $3
        RETURNING id`,
        [userId, bookId, kind]
    );

    return extractRows(result).length > 0;
}
