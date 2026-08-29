import {
    DEFAULT_BOOK_ACCESS_SETTINGS,
    type BookAccessSettings,
} from '@/config/book-access';
import { getNeonClient } from '@/lib/db/client';
import { extractRows } from '@/lib/db/utils';
import { isMissingTableOrColumnError } from '@/types/database';

const BOOK_ACCESS_SETTING_KEY = 'require_authentication_for_book_access';

type BookAccessSettingsRow = {
    booleanValue: boolean;
};

export async function getBookAccessSettings(): Promise<BookAccessSettings> {
    try {
        const relationRows = extractRows<{ exists: boolean }>(await getNeonClient().query(
            `SELECT to_regclass('public.site_settings') IS NOT NULL AS "exists"`
        ));
        if (!relationRows[0]?.exists) {
            return DEFAULT_BOOK_ACCESS_SETTINGS;
        }

        const rows = extractRows<BookAccessSettingsRow>(await getNeonClient().query(
            `SELECT boolean_value AS "booleanValue"
             FROM site_settings
             WHERE setting_key = $1`,
            [BOOK_ACCESS_SETTING_KEY]
        ));

        return {
            requireAuthenticationForBookAccess:
                rows[0]?.booleanValue ?? DEFAULT_BOOK_ACCESS_SETTINGS.requireAuthenticationForBookAccess,
        };
    } catch (error) {
        if (isMissingTableOrColumnError(error)) return DEFAULT_BOOK_ACCESS_SETTINGS;
        throw error;
    }
}

export async function updateBookAccessSettings(settings: BookAccessSettings): Promise<BookAccessSettings> {
    await getNeonClient().query(
        `INSERT INTO site_settings (setting_key, boolean_value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (setting_key) DO UPDATE SET
            boolean_value = EXCLUDED.boolean_value,
            updated_at = CURRENT_TIMESTAMP`,
        [BOOK_ACCESS_SETTING_KEY, settings.requireAuthenticationForBookAccess]
    );

    return settings;
}
