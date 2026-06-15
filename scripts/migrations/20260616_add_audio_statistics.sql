-- Lightweight audio statistics.
-- Regular audiobook plays are stored in system_logs; promo audio page plays
-- get a dedicated table because promo pages can be visited anonymously.

CREATE TABLE IF NOT EXISTS promo_audio_events (
    id BIGSERIAL PRIMARY KEY,
    promo_page_id INTEGER REFERENCES promo_pages(id) ON DELETE SET NULL,
    slug TEXT NOT NULL,
    book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
    book_title TEXT NOT NULL,
    media_id TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_audio_events_created_at
    ON promo_audio_events (created_at);

CREATE INDEX IF NOT EXISTS idx_promo_audio_events_slug_created_at
    ON promo_audio_events (slug, created_at);

CREATE INDEX IF NOT EXISTS idx_promo_audio_events_user_created_at
    ON promo_audio_events (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_promo_audio_events_ip_hash_created_at
    ON promo_audio_events (ip_hash, created_at);

CREATE INDEX IF NOT EXISTS idx_system_logs_download_stats
    ON system_logs (created_at)
    WHERE source = 'download-book' AND level = 'info';

CREATE INDEX IF NOT EXISTS idx_system_logs_reading_stats
    ON system_logs (created_at)
    WHERE message = '[read-book]' AND level = 'info';

CREATE INDEX IF NOT EXISTS idx_system_logs_audio_stats
    ON system_logs (created_at)
    WHERE source = 'audio-book' AND message = '[audio-play]' AND level = 'info';

CREATE INDEX IF NOT EXISTS idx_system_logs_user_stats
    ON system_logs (user_id, created_at)
    WHERE level = 'info';
