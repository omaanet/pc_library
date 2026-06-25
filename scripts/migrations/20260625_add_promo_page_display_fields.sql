-- Add promo-page-specific display overrides used by public promo templates.
-- Publishing date override is nullable and does not mutate the linked book.
-- Audio type stores admin-authored HTML and is sanitized at render time.

ALTER TABLE promo_pages
    ADD COLUMN IF NOT EXISTS publishing_date_override DATE NULL;

ALTER TABLE promo_pages
    ADD COLUMN IF NOT EXISTS audio_type TEXT NOT NULL DEFAULT 'Anteprima';
