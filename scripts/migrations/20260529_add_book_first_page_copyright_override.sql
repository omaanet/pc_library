ALTER TABLE books
  ADD COLUMN IF NOT EXISTS replace_first_page_with_copyright_override BOOLEAN;
