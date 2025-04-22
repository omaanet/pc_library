// src/app/api/books/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCommentsByBookId, addComment } from '@/lib/db-comments';
import { getSessionUser } from '@/lib/auth-utils';

// GET /api/books/[id]/comments — fetch threaded comments
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    // Properly await params to avoid NextJS sync params access warning
    const { id: bookId } = await Promise.resolve(params);

    if (typeof bookId !== 'string') {
        return NextResponse.json({ error: 'Invalid book id' }, { status: 400 });
    }
    const comments = getCommentsByBookId(bookId);
    return NextResponse.json({ comments });
}

// POST /api/books/[id]/comments — add a comment or reply
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    // Properly await params to avoid NextJS sync params access warning
    const { id: bookId } = await Promise.resolve(params);

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
