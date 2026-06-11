-- Promo audio pages: hidden, slug-addressable marketing pages for a single
-- promotional audio track linked to an existing book. Stores only
-- promo-specific data; book metadata is read from the books table at render.

CREATE TABLE IF NOT EXISTS promo_pages (
    id SERIAL PRIMARY KEY,
    book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    media_id TEXT,
    audio_length INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    template TEXT NOT NULL DEFAULT 'classic',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promo_pages_slug ON promo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_promo_pages_book_id ON promo_pages(book_id);
