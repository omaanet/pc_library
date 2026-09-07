import { NextRequest, NextResponse } from 'next/server';
import { requireManagedPageAccess } from '@/lib/admin-auth';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { ApiError, handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { assetRoot, listAssets, PREVIEW_ASSET_LIMITS, uploadCover, uploadPage } from '@/lib/preview-assets';
import { getBookById } from '@/lib/db/queries/books';

export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
    try {
        await requireManagedPageAccess('books');
        const bookId = request.nextUrl.searchParams.get('bookId');
        if (!bookId || !await getBookById(bookId)) throw new ApiError(HttpStatus.NOT_FOUND, 'Libro non trovato');
        const [preview, book, pages] = await Promise.all([listAssets(assetRoot('preview')), listAssets(assetRoot('book')), listAssets(assetRoot('pages', bookId))]);
        return NextResponse.json({ preview, book, pages }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) { return handleApiError(error, 'Impossibile elencare le immagini'); }
}
export const POST = withCSRFProtection(async (request: NextRequest) => {
    try {
        await requireManagedPageAccess('books');
        const source = request.nextUrl.searchParams.get('source') || 'preview';
        if (!['preview', 'pages'].includes(source)) throw new ApiError(HttpStatus.BAD_REQUEST, 'Destinazione immagini non valida');
        const bookId = request.nextUrl.searchParams.get('bookId');
        if (source === 'pages') {
            if (!bookId || !await getBookById(bookId)) throw new ApiError(HttpStatus.NOT_FOUND, 'Libro non trovato');
            try { assetRoot('pages', bookId); }
            catch { throw new ApiError(HttpStatus.BAD_REQUEST, 'Identificativo libro non valido'); }
        }
        if (process.env.VERCEL) throw new ApiError(HttpStatus.SERVICE_UNAVAILABLE, 'Il caricamento richiede un server con disco locale persistente.');
        const length = Number(request.headers.get('content-length'));
        if (length > PREVIEW_ASSET_LIMITS.uploadBytes + 65536) throw new ApiError(HttpStatus.BAD_REQUEST, 'File troppo grande (massimo 10 MB)');
        // Bound the entire multipart body even for chunked requests.
        const reader = request.body?.getReader();
        if (!reader) throw new ApiError(HttpStatus.BAD_REQUEST, 'File mancante');
        const chunks: Uint8Array[] = [];
        let total = 0;
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > PREVIEW_ASSET_LIMITS.uploadBytes + 65536) {
                await reader.cancel();
                throw new ApiError(HttpStatus.BAD_REQUEST, 'File troppo grande (massimo 10 MB)');
            }
            chunks.push(value);
        }
        let body: FormData;
        try { body = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData(); }
        catch { throw new ApiError(HttpStatus.BAD_REQUEST, 'Caricamento immagine non valido'); }
        const file = body.get('file');
        if (!(file instanceof File)) throw new ApiError(HttpStatus.BAD_REQUEST, 'Seleziona un’immagine');
        let filename: string;
        try {
            const bytes = Buffer.from(await file.arrayBuffer());
            filename = source === 'pages' ? await uploadPage(bookId!, bytes, file.name) : await uploadCover(bytes);
        }
        catch (error) {
            if (['EACCES', 'EPERM', 'EROFS'].includes((error as NodeJS.ErrnoException).code || '')) throw new ApiError(503, 'Directory immagini non scrivibile: verificare il disco persistente.');
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Immagine non valida. Usa JPEG, PNG o WebP, massimo 10 MB e 40 megapixel.');
        }
        return NextResponse.json({ path: filename }, { status: 201 });
    } catch (error) { return handleApiError(error, 'Impossibile caricare l’immagine'); }
});
