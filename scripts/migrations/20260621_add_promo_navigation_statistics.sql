-- First navigation to each active promo page, keyed by registered user or
-- anonymous HMAC IP hash. Raw IP addresses are intentionally not retained.

CREATE TABLE IF NOT EXISTS promo_navigation_events (
    id BIGSERIAL PRIMARY KEY,
    promo_page_id INTEGER REFERENCES promo_pages(id) ON DELETE SET NULL,
    slug TEXT NOT NULL,
    book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
    book_title TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_navigation_events_created_at
    ON promo_navigation_events (created_at);

CREATE INDEX IF NOT EXISTS idx_promo_navigation_events_slug_created_at
    ON promo_navigation_events (slug, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_navigation_events_user_page_unique
    ON promo_navigation_events (promo_page_id, user_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_navigation_events_ip_page_unique
    ON promo_navigation_events (promo_page_id, ip_hash)
    WHERE user_id IS NULL AND ip_hash IS NOT NULL;

-- Support the identity/page/time lookup used by first-visit conversion stats.
CREATE INDEX IF NOT EXISTS idx_promo_audio_events_page_user_created_at
    ON promo_audio_events (promo_page_id, user_id, created_at)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_promo_audio_events_page_ip_created_at
    ON promo_audio_events (promo_page_id, ip_hash, created_at)
    WHERE user_id IS NULL AND ip_hash IS NOT NULL;
