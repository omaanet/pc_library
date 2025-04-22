// src/lib/db-comments.ts
import { getDb } from './db';
import { Comment } from '@/types/comment';
import { v4 as uuidv4 } from 'uuid';

// Fetch all comments for a book, newest first, threaded
export function getCommentsByBookId(bookId: string): (Comment & { repliesCount: number })[] {
    const db = getDb();
    // Fetch all comments for the book, with repliesCount for each
    const rows = db.prepare(`
        SELECT 
            c.id, 
            c.book_id, 
            c.user_id, 
            c.user_name AS [userName], 
            c.is_admin AS [isAdmin], 
            c.content, 
            c.parent_id AS [parentId], 
            c.created_at AS [createdAt],
            (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) AS repliesCount
        FROM comments c
        WHERE c.book_id = ?
        ORDER BY c.created_at ASC
    `).all(bookId) as (Comment & { repliesCount: number })[];
    // Convert flat list to threaded structure
    const idToComment: Record<string, (Comment & { replies: (Comment & { repliesCount: number })[]; repliesCount: number })> = {};
    const roots: (Comment & { replies: (Comment & { repliesCount: number })[]; repliesCount: number })[] = [];
    for (const row of rows) {
        idToComment[row.id] = { ...row, replies: [], repliesCount: row.repliesCount };
    }
    for (const row of rows) {
        if (row.parentId && idToComment[row.parentId]) {
            idToComment[row.parentId].replies.push(idToComment[row.id]);
        } else {
            roots.push(idToComment[row.id]);
        }
    }
    return roots;
}

// Fetch direct replies for a comment (with repliesCount)
export function getRepliesByParentId(bookId: string, parentId: string): (Comment & { repliesCount: number })[] {
    const db = getDb();
    const rows = db.prepare(`
        SELECT 
            id, 
            book_id, 
            user_id, 
            user_name AS [userName], 
            is_admin AS [isAdmin], 
            content, 
            parent_id AS [parentId], 
            created_at AS [createdAt],
            (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) AS repliesCount
        FROM comments c
        WHERE c.book_id = ? AND c.parent_id = ?
        ORDER BY c.created_at ASC
    `).all(bookId, parentId) as (Comment & { repliesCount: number })[];
    return rows;
}

// Add a new comment or reply
export function addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'replies'>): Comment {
    const db = getDb();
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    db.prepare(`
        INSERT INTO comments (id, book_id, user_id, user_name, is_admin, content, parent_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        id,
        comment.bookId,
        comment.userId,
        comment.userName,
        comment.isAdmin ? 1 : 0,
        comment.content,
        comment.parentId || null,
        createdAt
    );
    return {
        ...comment,
        id,
        createdAt,
        replies: [],
    };
}
