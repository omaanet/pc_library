-- Add the new production book using its development metadata.
-- Preserve the source ID: reader page assets are stored under bookshelf/<book-id>/.
-- No existing book is updated. Reruns skip the matching book.
BEGIN;
LOCK TABLE books IN SHARE ROW EXCLUSIVE MODE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM books WHERE id = 'book-1791732188060' AND title IS DISTINCT FROM 'La notte dello Samhain') THEN
    RAISE EXCEPTION 'Source book ID already belongs to another title; insert aborted';
  END IF;
  IF EXISTS (SELECT 1 FROM books WHERE title = 'La notte dello Samhain' AND id <> 'book-1791732188060') THEN
    RAISE EXCEPTION 'Title already exists under a different ID; insert aborted';
  END IF;

  INSERT INTO books (
    id, title, genres, is_new, rating, extract, summary, media_id, has_audio, media_uid, is_preview, cover_image, media_title, pages_count, audio_length, display_order, publishing_date, is_audio_visible, preview_placement, is_reading_visible, replace_first_page_with_copyright_override
  )
  SELECT
    'book-1791732188060', 'La notte dello Samhain', ARRAY['Racconti']::text[], TRUE, NULL, NULL, '', NULL, FALSE, NULL, NULL, '2341099c-1c61-4c2d-bc5f-a76172d6de42.webp', NULL, 63, NULL, NULL, '2026-10-11T15:22:15.588Z', FALSE, NULL, TRUE, NULL
  WHERE NOT EXISTS (SELECT 1 FROM books WHERE id = 'book-1791732188060');
END
$$;

SELECT id, title, pages_count, is_reading_visible, is_audio_visible, is_visible
FROM books WHERE id = 'book-1791732188060';
COMMIT;
