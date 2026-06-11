-- Add a per-page template selector to promo pages. Controls which public
-- design renders the page ('classic' = original beige hero, 'modern' = the
-- glassmorphic audio-first template). Idempotent so it is safe to re-run on a
-- promo_pages table created before the column existed.

ALTER TABLE promo_pages ADD COLUMN IF NOT EXISTS template TEXT NOT NULL DEFAULT 'classic';
