import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { stat } from 'fs/promises';

export async function POST(request: NextRequest) {
    try {
        const { bookIds } = await request.json();
        if (!Array.isArray(bookIds)) {
            return NextResponse.json({ error: 'bookIds must be an array' }, { status: 400 });
        }
        const results: { [id: string]: boolean } = {};
        await Promise.all(
            bookIds.map(async (book_id: string) => {
                if (typeof book_id !== 'string' || !book_id.startsWith('book-')) {
                    results[book_id] = false;
                    return;
                }
                const filePath = path.join(process.cwd(), 'public', 'epub', book_id, 'output.epub');
                try {
                    await stat(filePath);
                    results[book_id] = true;
                } catch {
                    results[book_id] = false;
                }
            })
        );
        return NextResponse.json({ exists: results });
    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
