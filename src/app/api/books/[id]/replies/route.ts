// src/app/api/books/[id]/replies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRepliesByParentId } from '@/lib/db-comments';

// GET /api/books/[id]/replies?parentId=xxx
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, context: any) {
    const { id: bookId } = context.params;
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId');

    if (typeof bookId !== 'string' || typeof parentId !== 'string') {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    try {
        const replies = getRepliesByParentId(bookId, parentId);
        return NextResponse.json({ replies });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }
}
