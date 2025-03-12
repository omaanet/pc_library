-- Books table
CREATE TABLE books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    publishing_date TEXT NOT NULL, 
    summary TEXT NOT NULL,
    has_audio BOOLEAN NOT NULL DEFAULT 0,
    audio_length INTEGER,
    extract TEXT,
    rating INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    is_activated BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE user_preferences (
    user_id TEXT PRIMARY KEY,
    theme TEXT NOT NULL DEFAULT 'system',
    view_mode TEXT NOT NULL DEFAULT 'grid',
    email_new_releases BOOLEAN NOT NULL DEFAULT 1,
    email_reading_reminders BOOLEAN NOT NULL DEFAULT 1,
    email_recommendations BOOLEAN NOT NULL DEFAULT 1,
    reduce_animations BOOLEAN NOT NULL DEFAULT 0,
    high_contrast BOOLEAN NOT NULL DEFAULT 0,
    large_text BOOLEAN NOT NULL DEFAULT 0,
    font_size TEXT NOT NULL DEFAULT 'medium',
    line_spacing TEXT NOT NULL DEFAULT 'normal',
    font_family TEXT NOT NULL DEFAULT 'inter',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User stats table
CREATE TABLE user_stats (
    user_id TEXT PRIMARY KEY,
    total_books_read INTEGER NOT NULL DEFAULT 0,
    total_reading_time INTEGER NOT NULL DEFAULT 0,
    total_audio_time INTEGER NOT NULL DEFAULT 0,
    completed_books INTEGER NOT NULL DEFAULT 0,
    reading_streak INTEGER NOT NULL DEFAULT 0,
    last_read_date TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Book progress table
CREATE TABLE book_progress (
    book_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    current_page INTEGER,
    current_time INTEGER,
    progress REAL NOT NULL DEFAULT 0,
    last_read_date TEXT,
    status TEXT,
    PRIMARY KEY (book_id, user_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reading sessions table
CREATE TABLE reading_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    start_page INTEGER NOT NULL,
    end_page INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Audio sessions table
CREATE TABLE audio_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Notes table
CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bookmarks table
CREATE TABLE bookmarks (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    page INTEGER,
    time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_has_audio ON books(has_audio);
CREATE INDEX idx_book_progress_user ON book_progress(user_id);
CREATE INDEX idx_book_progress_status ON book_progress(status);
CREATE INDEX idx_reading_sessions_user ON reading_sessions(user_id);
CREATE INDEX idx_audio_sessions_user ON audio_sessions(user_id);