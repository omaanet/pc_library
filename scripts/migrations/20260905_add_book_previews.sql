-- Additive import: books is only a read source. Safe to rerun after preview edits.
CREATE TABLE IF NOT EXISTS book_previews (
    book_id TEXT PRIMARY KEY REFERENCES books(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
    expected_publication_date DATE DEFAULT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER,
    cover_source TEXT CHECK (cover_source IN ('preview', 'book')),
    cover_path TEXT,
    video_enabled BOOLEAN NOT NULL DEFAULT false,
    video_playback_id TEXT,
    video_title TEXT,
    video_viewer_uid TEXT,
    video_placement TEXT NOT NULL DEFAULT 'right' CHECK (video_placement IN ('left', 'right')),
    extract_enabled BOOLEAN NOT NULL DEFAULT false,
    extract_source TEXT NOT NULL DEFAULT 'text' CHECK (extract_source IN ('text', 'images')),
    extract_html TEXT,
    extract_image_paths TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((cover_source IS NULL AND cover_path IS NULL) OR
           (cover_source IS NOT NULL AND cover_path IS NOT NULL AND length(btrim(cover_path)) > 0)),
    CHECK (NOT video_enabled OR NULLIF(btrim(video_playback_id), '') IS NOT NULL),
    CHECK (array_position(extract_image_paths, NULL) IS NULL)
);

INSERT INTO book_previews (
    book_id, title, is_visible, display_order,
    video_enabled, video_playback_id, video_title, video_viewer_uid, video_placement
)
SELECT id, title, COALESCE(is_visible::text IN ('1', 'true', 't'), false), display_order,
       NULLIF(btrim(media_id), '') IS NOT NULL, media_id, media_title, media_uid,
       CASE WHEN preview_placement IN ('left', 'right') THEN preview_placement ELSE 'right' END
FROM books WHERE is_preview::text IN ('1', 'true', 't')
ON CONFLICT (book_id) DO NOTHING;
