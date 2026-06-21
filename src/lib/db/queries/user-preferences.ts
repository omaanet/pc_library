import { getNeonClient } from '@/lib/db/client';
import { getFirstRow } from '@/lib/db/utils';
import {
    isMissingTableOrColumnError,
    type DatabaseUserPreferences,
} from '@/types/database';
import {
    DEFAULT_USER_PREFERENCES,
    type UserPreferences,
} from '@/types/preferences';

function mapPreferences(row: DatabaseUserPreferences | null): UserPreferences {
    if (!row) return { ...DEFAULT_USER_PREFERENCES };

    return {
        theme: row.theme,
        bookBadgePalette: row.book_badge_palette,
        readerViewMode: row.reader_view_mode,
        readerZoom: Number(row.reader_zoom),
    };
}

export async function getUserPreferences(userId: number): Promise<UserPreferences> {
    const client = getNeonClient();
    try {
        const result = await client.query<DatabaseUserPreferences>(
            `SELECT user_id, theme, book_badge_palette, reader_view_mode,
                    reader_zoom, created_at, updated_at
             FROM user_preferences
             WHERE user_id = $1`,
            [userId]
        );

        return mapPreferences(getFirstRow(result));
    } catch (error: unknown) {
        if (!isMissingTableOrColumnError(error)) {
            throw error;
        }

        console.error(
            'User preferences schema is unavailable; returning defaults until the pending migration is applied.',
            error
        );
        return { ...DEFAULT_USER_PREFERENCES };
    }
}

export async function upsertUserPreferences(
    userId: number,
    patch: Partial<UserPreferences>
): Promise<UserPreferences> {
    const client = getNeonClient();
    const result = await client.query<DatabaseUserPreferences>(
        `INSERT INTO user_preferences (
            user_id, theme, book_badge_palette, reader_view_mode, reader_zoom
         ) VALUES (
            $1,
            COALESCE($2, 'system'),
            COALESCE($3, 'gold'),
            COALESCE($4, 'double'),
            COALESCE($5, 1.00)
         )
         ON CONFLICT (user_id) DO UPDATE SET
            theme = COALESCE($2, user_preferences.theme),
            book_badge_palette = COALESCE($3, user_preferences.book_badge_palette),
            reader_view_mode = COALESCE($4, user_preferences.reader_view_mode),
            reader_zoom = COALESCE($5, user_preferences.reader_zoom),
            updated_at = CURRENT_TIMESTAMP
         RETURNING user_id, theme, book_badge_palette, reader_view_mode,
                   reader_zoom, created_at, updated_at`,
        [
            userId,
            patch.theme ?? null,
            patch.bookBadgePalette ?? null,
            patch.readerViewMode ?? null,
            patch.readerZoom ?? null,
        ]
    );

    return mapPreferences(getFirstRow(result));
}
