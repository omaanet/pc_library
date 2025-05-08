// src/lib/db-comments.ts
import { getNeonClient, extractRows } from './db';
import { Comment } from '@/types/comment';
import { v4 as uuidv4 } from 'uuid';

// Fetch all comments for a book, newest first, threaded
export async function getCommentsByBookId(bookId: string): Promise<(Comment & { repliesCount: number; replies: (Comment & { repliesCount: number })[] })[]> {
    const client = getNeonClient();
    // Fetch all comments for the book, with repliesCount for each
    const res = await client.query(
        `SELECT 
            c.id, 
            c.book_id, 
            c.user_id, 
            c.user_name AS "userName", 
            c.is_admin AS "isAdmin", 
            c.content, 
            c.parent_id AS "parentId", 
            c.created_at AS "createdAt",
            (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) AS "repliesCount"
        FROM comments c
        WHERE c.book_id = $1
        ORDER BY c.created_at ASC LIMIT 3`,
        [bookId]
    );
    const rows = extractRows<Comment & { repliesCount: number }>(res);
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
export async function getRepliesByParentId(bookId: string, parentId: string): Promise<(Comment & { repliesCount: number })[]> {
    const client = getNeonClient();
    const res = await client.query(
        `SELECT 
            id, 
            book_id, 
            user_id, 
            user_name AS "userName", 
            is_admin AS "isAdmin", 
            content, 
            parent_id AS "parentId", 
            created_at AS "createdAt",
            (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) AS "repliesCount"
        FROM comments c
        WHERE c.book_id = $1 AND c.parent_id = $2
        ORDER BY c.created_at ASC`,
        [bookId, parentId]
    );
    const rows = extractRows<Comment & { repliesCount: number }>(res);
    return rows;
}

// Add a new comment or reply
export async function addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'replies'>): Promise<Comment> {
    const client = getNeonClient();
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    await client.query(
        `INSERT INTO comments (id, book_id, user_id, user_name, is_admin, content, parent_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, comment.bookId, comment.userId, comment.userName, comment.isAdmin ? 1 : 0, comment.content, comment.parentId || null, createdAt]
    );
    return {
        ...comment,
        id,
        createdAt,
        replies: [],
    };

}
