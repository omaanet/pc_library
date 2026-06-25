-- Promo pages are addressed by unique slug, not by book. A single book may have
-- multiple promo pages for separate campaigns, templates, or audio variants.
-- Remove any accidental legacy uniqueness on promo_pages.book_id while keeping
-- the non-unique lookup index.

DO $$
DECLARE
    constraint_record RECORD;
    index_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_attribute a
            ON a.attrelid = c.conrelid
            AND a.attnum = ANY (c.conkey)
        WHERE c.conrelid = 'public.promo_pages'::regclass
            AND c.contype = 'u'
            AND a.attname = 'book_id'
            AND array_length(c.conkey, 1) = 1
    LOOP
        EXECUTE format('ALTER TABLE public.promo_pages DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
    END LOOP;

    FOR index_record IN
        SELECT i.relname
        FROM pg_index ix
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a
            ON a.attrelid = ix.indrelid
            AND a.attnum = ANY (ix.indkey)
        LEFT JOIN pg_constraint c ON c.conindid = ix.indexrelid
        WHERE ix.indrelid = 'public.promo_pages'::regclass
            AND ix.indisunique
            AND NOT ix.indisprimary
            AND c.oid IS NULL
            AND a.attname = 'book_id'
            AND array_length(ix.indkey, 1) = 1
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS public.%I', index_record.relname);
    END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_promo_pages_book_id ON promo_pages(book_id);
