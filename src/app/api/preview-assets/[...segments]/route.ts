import { NextRequest, NextResponse } from 'next/server';
import { readAsset } from '@/lib/preview-assets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: NextRequest, { params }: { params: Promise<{ segments: string[] }> }) {
    try {
        const [source, ...parts] = (await params).segments;
        if (!['preview', 'book', 'pages'].includes(source)) return new NextResponse(null, { status: 404 });
        const bookId = source === 'pages' ? parts.shift() : undefined;
        const asset = await readAsset(source as 'preview' | 'book' | 'pages', parts.join('/'), bookId);
        return new NextResponse(new Uint8Array(asset.bytes), { headers: {
            'Content-Type': asset.contentType, 'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; sandbox",
            'Cache-Control': 'no-cache',
        } });
    } catch { return new NextResponse(null, { status: 404 }); }
}
