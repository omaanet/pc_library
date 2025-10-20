// src/app/api/books/[id]/replies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRepliesByParentId } from '@/lib/db-comments';

// GET /api/books/[id]/replies?parentId=xxx
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id: bookId } = await context.params;
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId');

    if (typeof bookId !== 'string' || typeof parentId !== 'string') {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    try {
        const replies = await getRepliesByParentId(bookId, parentId);
        return NextResponse.json({ replies });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }
}
