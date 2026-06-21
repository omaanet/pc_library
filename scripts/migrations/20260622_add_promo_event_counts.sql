-- Keep one lifetime row per promo page/listener/action while retaining exact
-- daily action totals for date-filtered statistics.

ALTER TABLE promo_navigation_events
    ADD COLUMN IF NOT EXISTS count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE promo_audio_events
    ADD COLUMN IF NOT EXISTS count INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS promo_navigation_daily_counts (
    event_id BIGINT NOT NULL REFERENCES promo_navigation_events(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    count INTEGER NOT NULL DEFAULT 1 CHECK (count > 0),
    PRIMARY KEY (event_id, event_date)
);

CREATE TABLE IF NOT EXISTS promo_audio_daily_counts (
    event_id BIGINT NOT NULL REFERENCES promo_audio_events(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    count INTEGER NOT NULL DEFAULT 1 CHECK (count > 0),
    PRIMARY KEY (event_id, event_date)
);

-- Visits were already unique, so each historic row represents one known visit.
INSERT INTO promo_navigation_daily_counts (event_id, event_date, count)
SELECT id, created_at::date, count
FROM promo_navigation_events
ON CONFLICT (event_id, event_date) DO NOTHING;

-- Promo plays were append-only. Map every historic row to the row that will be
-- retained for that page/listener and preserve its original calendar date.
WITH mapped_audio_events AS (
    SELECT
        CASE
            WHEN promo_page_id IS NOT NULL AND user_id IS NOT NULL THEN
                MIN(id) OVER (PARTITION BY promo_page_id, user_id)
            WHEN promo_page_id IS NOT NULL AND user_id IS NULL AND ip_hash IS NOT NULL THEN
                MIN(id) OVER (PARTITION BY promo_page_id, ip_hash)
            ELSE id
        END AS event_id,
        created_at::date AS event_date,
        count
    FROM promo_audio_events
), daily_totals AS (
    SELECT event_id, event_date, SUM(count)::integer AS count
    FROM mapped_audio_events
    GROUP BY event_id, event_date
)
INSERT INTO promo_audio_daily_counts (event_id, event_date, count)
SELECT event_id, event_date, count
FROM daily_totals
ON CONFLICT (event_id, event_date) DO NOTHING;

-- Consolidate registered play rows and retain the earliest row as the identity
-- record referenced by the daily table.
WITH totals AS (
    SELECT
        promo_page_id,
        user_id,
        MIN(id) AS retained_id,
        SUM(count)::integer AS total_count
    FROM promo_audio_events
    WHERE promo_page_id IS NOT NULL AND user_id IS NOT NULL
    GROUP BY promo_page_id, user_id
)
UPDATE promo_audio_events event
SET count = totals.total_count
FROM totals
WHERE event.id = totals.retained_id;

DELETE FROM promo_audio_events event
USING promo_audio_events retained
WHERE event.promo_page_id = retained.promo_page_id
    AND event.user_id = retained.user_id
    AND event.user_id IS NOT NULL
    AND event.id > retained.id;

-- Consolidate anonymous play rows using the HMAC IP hash identity.
WITH totals AS (
    SELECT
        promo_page_id,
        ip_hash,
        MIN(id) AS retained_id,
        SUM(count)::integer AS total_count
    FROM promo_audio_events
    WHERE promo_page_id IS NOT NULL AND user_id IS NULL AND ip_hash IS NOT NULL
    GROUP BY promo_page_id, ip_hash
)
UPDATE promo_audio_events event
SET count = totals.total_count
FROM totals
WHERE event.id = totals.retained_id;

DELETE FROM promo_audio_events event
USING promo_audio_events retained
WHERE event.promo_page_id = retained.promo_page_id
    AND event.user_id IS NULL
    AND retained.user_id IS NULL
    AND event.ip_hash = retained.ip_hash
    AND event.ip_hash IS NOT NULL
    AND event.id > retained.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_audio_events_user_page_unique
    ON promo_audio_events (promo_page_id, user_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_audio_events_ip_page_unique
    ON promo_audio_events (promo_page_id, ip_hash)
    WHERE user_id IS NULL AND ip_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_promo_navigation_daily_counts_date
    ON promo_navigation_daily_counts (event_date);

CREATE INDEX IF NOT EXISTS idx_promo_audio_daily_counts_date
    ON promo_audio_daily_counts (event_date);
