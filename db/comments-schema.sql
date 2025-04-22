-- db/comments-schema.sql
CREATE TABLE "comments" (
	[id]	TEXT NOT NULL UNIQUE,
	[book_id]	TEXT NOT NULL,
	[user_id]	INTEGER NOT NULL,
	[user_name]	TEXT NOT NULL,
	[is_admin]	INTEGER DEFAULT 0,
	[text]	TEXT NOT NULL,
	[parent_id]	TEXT,
	[created_at]	TEXT NOT NULL,
	PRIMARY KEY([id]),
	FOREIGN KEY([book_id]) REFERENCES [books]([id]) ON DELETE CASCADE,
	FOREIGN KEY([parent_id]) REFERENCES [comments]([id]) ON DELETE CASCADE,
	FOREIGN KEY([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE
)
CREATE INDEX IF NOT EXISTS idx_comments_book_id ON comments(book_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
