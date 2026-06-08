ALTER TABLE books
  ADD COLUMN IF NOT EXISTS is_reading_visible BOOLEAN;

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS is_audio_visible BOOLEAN;

UPDATE books
SET
  is_reading_visible = COALESCE(is_visible, 1) <> 0,
  is_audio_visible = has_audio AND COALESCE(is_visible, 1) <> 0
WHERE is_reading_visible IS NULL
   OR is_audio_visible IS NULL;

ALTER TABLE books
  ALTER COLUMN is_reading_visible SET DEFAULT TRUE,
  ALTER COLUMN is_reading_visible SET NOT NULL,
  ALTER COLUMN is_audio_visible SET DEFAULT FALSE,
  ALTER COLUMN is_audio_visible SET NOT NULL;

ALTER TABLE books
  DROP COLUMN IF EXISTS is_visible;

ALTER TABLE books
  ADD COLUMN is_visible INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN is_reading_visible OR (has_audio AND is_audio_visible) THEN 1
      ELSE 0
    END
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_books_is_visible ON books(is_visible);
CREATE INDEX IF NOT EXISTS idx_books_is_audio_visible ON books(is_audio_visible);
