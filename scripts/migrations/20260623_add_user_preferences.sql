CREATE TABLE IF NOT EXISTS user_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system',
  book_badge_palette TEXT NOT NULL DEFAULT 'gold',
  reader_view_mode TEXT NOT NULL DEFAULT 'double',
  reader_zoom NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_preferences_theme_check
    CHECK (theme IN ('light', 'dark', 'system')),
  CONSTRAINT user_preferences_badge_palette_check
    CHECK (book_badge_palette IN ('gold', 'ocean', 'lagoon', 'lavender', 'coral', 'paper')),
  CONSTRAINT user_preferences_reader_view_check
    CHECK (reader_view_mode IN ('single', 'double')),
  CONSTRAINT user_preferences_reader_zoom_check
    CHECK (reader_zoom >= 0.10 AND reader_zoom <= 3.00)
);

-- Upgrade legacy user_preferences tables. CREATE TABLE IF NOT EXISTS does not
-- add columns when an older version of the table already exists.
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS book_badge_palette TEXT DEFAULT 'gold',
  ADD COLUMN IF NOT EXISTS reader_view_mode TEXT DEFAULT 'double',
  ADD COLUMN IF NOT EXISTS reader_zoom NUMERIC(4, 2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Preserve compatible values from the legacy reader preference columns when
-- they are present. Unsupported values intentionally fall back to defaults.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'user_preferences'
      AND column_name = 'view_mode'
  ) THEN
    EXECUTE $sql$
      UPDATE user_preferences
      SET reader_view_mode = CASE
        WHEN view_mode IN ('single', 'double') THEN view_mode
        ELSE 'double'
      END
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'user_preferences'
      AND column_name = 'zoom_level'
  ) THEN
    EXECUTE $sql$
      UPDATE user_preferences
      SET reader_zoom = CASE
        WHEN zoom_level BETWEEN 10 AND 300 THEN zoom_level / 100.0
        ELSE 1.00
      END
    $sql$;
  END IF;
END
$migration$;

UPDATE user_preferences
SET
  theme = CASE WHEN theme IN ('light', 'dark', 'system') THEN theme ELSE 'system' END,
  book_badge_palette = CASE
    WHEN book_badge_palette IN ('gold', 'ocean', 'lagoon', 'lavender', 'coral', 'paper')
      THEN book_badge_palette
    ELSE 'gold'
  END,
  reader_view_mode = CASE
    WHEN reader_view_mode IN ('single', 'double') THEN reader_view_mode
    ELSE 'double'
  END,
  reader_zoom = CASE
    WHEN reader_zoom >= 0.10 AND reader_zoom <= 3.00 THEN reader_zoom
    ELSE 1.00
  END,
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);

ALTER TABLE user_preferences
  ALTER COLUMN theme SET DEFAULT 'system',
  ALTER COLUMN theme SET NOT NULL,
  ALTER COLUMN book_badge_palette SET DEFAULT 'gold',
  ALTER COLUMN book_badge_palette SET NOT NULL,
  ALTER COLUMN reader_view_mode SET DEFAULT 'double',
  ALTER COLUMN reader_view_mode SET NOT NULL,
  ALTER COLUMN reader_zoom SET DEFAULT 1.00,
  ALTER COLUMN reader_zoom SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET NOT NULL;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'user_preferences'::regclass
      AND conname = 'user_preferences_theme_check'
  ) THEN
    ALTER TABLE user_preferences
      ADD CONSTRAINT user_preferences_theme_check
      CHECK (theme IN ('light', 'dark', 'system'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'user_preferences'::regclass
      AND conname = 'user_preferences_badge_palette_check'
  ) THEN
    ALTER TABLE user_preferences
      ADD CONSTRAINT user_preferences_badge_palette_check
      CHECK (book_badge_palette IN ('gold', 'ocean', 'lagoon', 'lavender', 'coral', 'paper'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'user_preferences'::regclass
      AND conname = 'user_preferences_reader_view_check'
  ) THEN
    ALTER TABLE user_preferences
      ADD CONSTRAINT user_preferences_reader_view_check
      CHECK (reader_view_mode IN ('single', 'double'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'user_preferences'::regclass
      AND conname = 'user_preferences_reader_zoom_check'
  ) THEN
    ALTER TABLE user_preferences
      ADD CONSTRAINT user_preferences_reader_zoom_check
      CHECK (reader_zoom >= 0.10 AND reader_zoom <= 3.00);
  END IF;
END
$migration$;

INSERT INTO user_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;
