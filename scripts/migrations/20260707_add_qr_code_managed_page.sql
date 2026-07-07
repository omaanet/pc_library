INSERT INTO managed_pages (page_key, access_level, display_order)
SELECT 'qr-code', 1, COALESCE(MAX(display_order), 0) + 1
FROM managed_pages
WHERE access_level = 1
ON CONFLICT (page_key) DO NOTHING;
