CREATE TABLE IF NOT EXISTS managed_pages (
    page_key TEXT PRIMARY KEY,
    access_level INTEGER NOT NULL CHECK (access_level BETWEEN 0 AND 3),
    display_order INTEGER NOT NULL CHECK (display_order > 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT managed_pages_level_order_unique UNIQUE (access_level, display_order) DEFERRABLE INITIALLY DEFERRED
);

INSERT INTO managed_pages (page_key, access_level, display_order)
VALUES
    ('settings', 0, 1),
    ('guide', 0, 2),
    ('books', 1, 1),
    ('statistics', 1, 2),
    ('promo-pages', 2, 1),
    ('animations', 2, 2),
    ('migrations', 2, 3),
    ('users', 3, 1),
    ('pages', 3, 2)
ON CONFLICT (page_key) DO NOTHING;
