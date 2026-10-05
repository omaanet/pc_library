-- Run before deploying the book genres feature, including on production.
-- Existing books receive Racconti; rerunning preserves explicitly saved genres.
BEGIN;

ALTER TABLE books
    ADD COLUMN IF NOT EXISTS genres TEXT[] DEFAULT ARRAY['Racconti']::TEXT[];

UPDATE books SET genres = ARRAY['Racconti']::TEXT[] WHERE genres IS NULL;

ALTER TABLE books
    ALTER COLUMN genres SET DEFAULT ARRAY['Racconti']::TEXT[],
    ALTER COLUMN genres SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'books_genres_valid' AND conrelid = 'books'::regclass
    ) THEN
        ALTER TABLE books ADD CONSTRAINT books_genres_valid CHECK (
            cardinality(genres) BETWEEN 1 AND 2
            AND array_ndims(genres) = 1
            AND array_lower(genres, 1) = 1
            AND array_position(genres, NULL) IS NULL
            AND genres <@ ARRAY['Racconti', 'Racconti per bambini']::TEXT[]
            AND (cardinality(genres) = 1 OR genres[1] <> genres[2])
        );
    END IF;
END $$;

COMMIT;
