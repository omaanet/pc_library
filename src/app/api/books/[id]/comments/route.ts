// src/app/api/books/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCommentsByBookId, addComment } from '@/lib/db-comments';
import { getSessionUser } from '@/lib/auth-utils';

// GET /api/books/[id]/comments — fetch threaded comments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, context: any) {
    const { id: bookId } = context.params;

    if (typeof bookId !== 'string') {
        return NextResponse.json({ error: 'Invalid book id' }, { status: 400 });
    }
    const comments = getCommentsByBookId(bookId);
    return NextResponse.json({ comments });
}

// POST /api/books/[id]/comments — add a comment or reply
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, context: any) {
    const { id: bookId } = context.params;

    if (typeof bookId !== 'string') {
        return NextResponse.json({ error: 'Invalid book id' }, { status: 400 });
    }
    // Only allow authenticated users
    const user = await getSessionUser(req);
    if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const body = await req.json();
    const { content, parentId } = body;
    if (!content || typeof content !== 'string') {
        return NextResponse.json({ error: 'Comment content required' }, { status: 400 });
    }
    const comment = {
        bookId,
        userId: user.id,
        userName: user.fullName,
        isAdmin: !!user.isAdmin,
        content,
        parentId: parentId || null,
    };
    const saved = addComment(comment);
    return NextResponse.json({ comment: saved }, { status: 201 });
}
