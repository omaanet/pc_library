import { NextResponse } from 'next/server';
import { getPublicPreviews } from '@/lib/db/queries/book-previews';
import { publicPreview } from '@/lib/book-preview';
import { handleApiError } from '@/lib/api-error-handler';

export const dynamic = 'force-dynamic';
export async function GET() {
    try {
        return NextResponse.json({ previews: (await getPublicPreviews()).map(publicPreview) }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) { return handleApiError(error, 'Impossibile caricare le anteprime'); }
}
