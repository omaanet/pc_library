-- Store one regular audiobook listen per listener/book pair.
-- The API may receive repeated play notifications; uniqueness stays in the DB.

DELETE FROM system_logs
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY user_id, details->>'bookId'
                ORDER BY created_at ASC, id ASC
            ) AS rn
        FROM system_logs
        WHERE source = 'audio-book'
            AND message = '[audio-play]'
            AND level = 'info'
            AND user_id IS NOT NULL
            AND details ? 'bookId'
            AND COALESCE(details->>'bookId', '') <> ''
    ) ranked
    WHERE rn > 1
);

DELETE FROM system_logs
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY ip_address, details->>'bookId'
                ORDER BY created_at ASC, id ASC
            ) AS rn
        FROM system_logs
        WHERE source = 'audio-book'
            AND message = '[audio-play]'
            AND level = 'info'
            AND user_id IS NULL
            AND ip_address IS NOT NULL
            AND details ? 'bookId'
            AND COALESCE(details->>'bookId', '') <> ''
    ) ranked
    WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_logs_audio_user_book_unique
    ON system_logs (user_id, (details->>'bookId'))
    WHERE source = 'audio-book'
        AND message = '[audio-play]'
        AND level = 'info'
        AND user_id IS NOT NULL
        AND details ? 'bookId'
        AND COALESCE(details->>'bookId', '') <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_logs_audio_ip_book_unique
    ON system_logs (ip_address, (details->>'bookId'))
    WHERE source = 'audio-book'
        AND message = '[audio-play]'
        AND level = 'info'
        AND user_id IS NULL
        AND ip_address IS NOT NULL
        AND details ? 'bookId'
        AND COALESCE(details->>'bookId', '') <> '';
