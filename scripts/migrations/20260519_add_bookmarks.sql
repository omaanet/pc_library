CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page INTEGER,
  time INTEGER,
  kind TEXT,
  page_number INTEGER,
  audio_time_seconds INTEGER,
  audio_media_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE bookmarks
  ADD COLUMN IF NOT EXISTS kind TEXT,
  ADD COLUMN IF NOT EXISTS page_number INTEGER,
  ADD COLUMN IF NOT EXISTS audio_time_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS audio_media_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

UPDATE bookmarks
SET
  kind = CASE
    WHEN kind IS NOT NULL THEN kind
    WHEN page IS NOT NULL THEN 'reader'
    WHEN time IS NOT NULL THEN 'audio'
    ELSE 'reader'
  END,
  page_number = COALESCE(page_number, page),
  audio_time_seconds = COALESCE(audio_time_seconds, time),
  updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP);

UPDATE bookmarks
SET page_number = 1
WHERE kind = 'reader' AND page_number IS NULL;

UPDATE bookmarks
SET audio_time_seconds = 0
WHERE kind = 'audio' AND audio_time_seconds IS NULL;

DELETE FROM bookmarks b
USING bookmarks older
WHERE b.user_id = older.user_id
  AND b.book_id = older.book_id
  AND b.kind = older.kind
  AND b.ctid < older.ctid;

ALTER TABLE bookmarks
  ALTER COLUMN kind SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_user_book_kind
  ON bookmarks(user_id, book_id, kind);

CREATE INDEX IF NOT EXISTS idx_bookmarks_book_user
  ON bookmarks(book_id, user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookmarks_kind_check'
  ) THEN
    ALTER TABLE bookmarks
      ADD CONSTRAINT bookmarks_kind_check
      CHECK (kind IN ('reader', 'audio'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookmarks_position_check'
  ) THEN
    ALTER TABLE bookmarks
      ADD CONSTRAINT bookmarks_position_check
      CHECK (
        (kind = 'reader' AND page_number IS NOT NULL AND page_number > 0)
        OR
        (kind = 'audio' AND audio_time_seconds IS NOT NULL AND audio_time_seconds >= 0)
      );
  END IF;
END $$;
