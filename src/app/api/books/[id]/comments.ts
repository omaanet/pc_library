// src/app/api/books/[id]/comments.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCommentsByBookId, addComment } from '@/lib/db-comments';
import { Comment } from '@/types/comment';
import { getSessionUser } from '@/lib/auth-utils';

// GET /api/books/[id]/comments — fetch threaded comments
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {
        query: { id: bookId },
        method,
    } = req;

    if (typeof bookId !== 'string') {
        return res.status(400).json({ error: 'Invalid book id' });
    }

    if (method === 'GET') {
        const comments = getCommentsByBookId(bookId);
        return res.status(200).json({ comments });
    }

    if (method === 'POST') {
        // Only allow authenticated users
        const user = await getSessionUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { content, parentId } = req.body;
        if (!content || typeof content !== 'string') {
            return res.status(400).json({ error: 'Comment content required' });
        }
        const comment: Omit<Comment, 'id' | 'createdAt' | 'replies'> = {
            bookId,
            userId: user.id,
            userName: user.fullName,
            isAdmin: !!user.isAdmin,
            content,
            parentId: parentId || null,
        };
        const saved = addComment(comment);
        return res.status(201).json({ comment: saved });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
