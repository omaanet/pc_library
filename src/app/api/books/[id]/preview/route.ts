import { NextRequest, NextResponse } from 'next/server';
import { requireManagedPageAccess } from '@/lib/admin-auth';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { ApiError, handleApiError, HttpStatus } from '@/lib/api-error-handler';
import { getBookById } from '@/lib/db/queries/books';
import { getBookPreview, saveBookPreview } from '@/lib/db/queries/book-previews';
import { previewSchema } from '@/lib/book-preview';
import { assetRoot, resolveAsset, validatePageImage } from '@/lib/preview-assets';

type Context = { params: Promise<{ id: string }> };
async function parent(context: Context) {
    const { id } = await context.params;
    const book = await getBookById(id);
    if (!book) throw new ApiError(HttpStatus.NOT_FOUND, 'Libro non trovato');
    return book;
}
export async function GET(_request: NextRequest, context: Context) {
    try {
        await requireManagedPageAccess('books');
        const book = await parent(context);
        let preview = null;
        let migrationRequired = false;
        try { preview = await getBookPreview(book.id); }
        catch (error) {
            if ((error as { code?: string }).code !== '42P01') throw error;
            migrationRequired = true;
        }
        return NextResponse.json({ preview, migrationRequired, book: { id: book.id, title: book.title, coverImage: book.coverImage } }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) { return handleApiError(error, 'Impossibile caricare l’anteprima'); }
}
export const PUT = withCSRFProtection(async (request: NextRequest, context: Context) => {
    try {
        await requireManagedPageAccess('books');
        const book = await parent(context);
        let body: unknown;
        try { body = await request.json(); }
        catch { throw new ApiError(HttpStatus.BAD_REQUEST, 'Dati anteprima non validi'); }
        const parsed = previewSchema.safeParse(body);
        if (!parsed.success) throw new ApiError(HttpStatus.BAD_REQUEST, parsed.error.issues.map(i => i.message).join('. '));
        const preview = parsed.data;
        try {
            if (preview.coverSource && preview.coverPath) await resolveAsset(assetRoot(preview.coverSource), preview.coverPath);
            // Inactive selections are retained, including references to temporarily missing files.
            if (preview.extractEnabled && preview.extractSource === 'images') {
                for (const file of preview.extractImagePaths) await validatePageImage(book.id, file);
            }
        } catch { throw new ApiError(HttpStatus.BAD_REQUEST, 'Una delle immagini selezionate non è disponibile. Aggiorna l’elenco.'); }
        return NextResponse.json({ preview: await saveBookPreview(book.id, preview) }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) { return handleApiError(error, 'Impossibile salvare l’anteprima'); }
});
