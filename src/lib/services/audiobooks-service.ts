import Database from 'better-sqlite3';
import path from 'path';
import { AudioBook } from '@/types';

const dbPath = path.join(process.cwd(), 'db', 'books.db3');

export class AudiobooksService {
    private db: Database.Database;

    constructor() {
        this.db = new Database(dbPath);
    }

    /**
     * Get audiobook data by book_id
     */
    getByBookId(bookId: string): AudioBook | null {
        const query = `
      SELECT * FROM audiobooks 
      WHERE book_id = ?
    `;

        const result = this.db.prepare(query).get(bookId) as AudioBook | null;
        return result;
    }

    /**
     * Save audiobook data (create or update)
     */
    save(data: {
        book_id: string;
        media_id: string | null;
        audio_length: number | null;
        publishing_date: string | null;
    }): AudioBook {
        // Check if entry exists
        const existing = this.getByBookId(data.book_id);

        if (existing) {
            // Update existing record
            const query = `
        UPDATE audiobooks
        SET 
          media_id = ?,
          audio_length = ?, 
          publishing_date = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE book_id = ?
      `;

            this.db.prepare(query).run(
                data.media_id,
                data.audio_length,
                data.publishing_date,
                data.book_id
            );

            return this.getByBookId(data.book_id) as AudioBook;
        } else {
            // Create new record
            const query = `
        INSERT INTO audiobooks (
          book_id, 
          media_id,
          audio_length, 
          publishing_date
        ) VALUES (?, ?, ?, ?)
      `;

            this.db.prepare(query).run(
                data.book_id,
                data.media_id,
                data.audio_length,
                data.publishing_date
            );

            return this.getByBookId(data.book_id) as AudioBook;
        }
    }
}

// Create a singleton instance
const audiobooksService = new AudiobooksService();
export default audiobooksService;
