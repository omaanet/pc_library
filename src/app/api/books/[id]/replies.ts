import { NextApiRequest, NextApiResponse } from 'next';
import { getRepliesByParentId } from '@/lib/db-comments';

// GET /api/books/[id]/replies?parentId=xxx
export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const {
        query: { id: bookId, parentId },
        method,
    } = req;

    if (typeof bookId !== 'string' || typeof parentId !== 'string') {
        return res.status(400).json({ error: 'Invalid request' });
    }

    if (method === 'GET') {
        try {
            const replies = getRepliesByParentId(bookId, parentId);
            return res.status(200).json({ replies });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to fetch replies' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
