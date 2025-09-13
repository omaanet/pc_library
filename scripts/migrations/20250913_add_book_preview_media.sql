-- Migration: Add preview media fields to books table
-- Neon PostgreSQL (positioning after a specific column is not supported; columns will be appended)

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS media_id TEXT;

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS media_title TEXT;

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS media_uid TEXT;

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS preview_placement TEXT;
