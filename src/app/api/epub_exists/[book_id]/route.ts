import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { stat } from 'fs/promises';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ book_id: string }> }
): Promise<NextResponse> {
    try {
        const { book_id } = await params;
        if (typeof book_id !== 'string' || !book_id.startsWith('book-')) {
            return NextResponse.json({ exists: false }, { status: 400 });
        }
        const filePath = path.join(process.cwd(), 'public', 'epub', book_id, 'output.epub');
        try {
            await stat(filePath);
            return NextResponse.json({ exists: true });
        } catch {
            return NextResponse.json({ exists: false });
        }
    } catch (error) {
        return NextResponse.json({ exists: false, error: 'Internal error' }, { status: 500 });
    }
}
