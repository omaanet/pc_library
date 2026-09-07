'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Book } from '@/types';
import type { PreviewInput, PublicBookPreview } from '@/types/book-preview';
import { emptyPreview, previewAssetUrl, previewSchema, publicPreview } from '@/lib/book-preview';
import { previewRequest } from '@/lib/services/preview-api-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { BookPreviewDialogContent } from '@/components/previews/book-preview-card';
import { PreviewAssetPicker } from './preview-asset-picker';

type Assets = { preview: string[]; book: string[]; pages: string[] };
export function BookPreviewEditor({ book }: { book: Book }) {
    const [draft, setDraft] = useState<PreviewInput>(emptyPreview(book.title));
    const [bookCover, setBookCover] = useState<string | null>(book.coverImage || null);
    const [assets, setAssets] = useState<Assets>({ preview: [], book: [], pages: [] });
    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [ready, setReady] = useState(false);
    const [migrationRequired, setMigrationRequired] = useState(false);
    const [busy, setBusy] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [inspection, setInspection] = useState<PublicBookPreview | null>(null);
    const [inspectOpen, setInspectOpen] = useState(false);
    const cache = useQueryClient();
    const change = <K extends keyof PreviewInput>(key: K, value: PreviewInput[K]) => {
        setDraft(previous => ({ ...previous, [key]: value })); setMessage('');
    };
    const refreshAssets = useCallback(async () => {
        const result = await previewRequest(`/api/previews/assets?bookId=${encodeURIComponent(book.id)}`);
        setAssets(result); setAssetsLoaded(true);
    }, [book.id]);
    const load = useCallback(async () => {
        setLoading(true); setError(''); setReady(false);
        try {
            const data = await previewRequest(`/api/books/${encodeURIComponent(book.id)}/preview`);
            setMigrationRequired(!!data.migrationRequired);
            setDraft(data.preview || emptyPreview(data.book.title)); setBookCover(data.book.coverImage || null); setReady(true);
            await refreshAssets();
        } catch (e) { setError((e as Error).message); }
        finally { setLoading(false); }
    }, [book.id, refreshAssets]);
    useEffect(() => { void load(); }, [load]);

    async function save() {
        setError(''); setMessage('');
        const parsed = previewSchema.safeParse(draft);
        if (!parsed.success) { setError(parsed.error.issues.map(i => i.message).join('. ')); return; }
        setBusy(true);
        try {
            const data = await previewRequest(`/api/books/${encodeURIComponent(book.id)}/preview`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) });
            setDraft(data.preview); setMessage('Anteprima salvata.');
            await cache.invalidateQueries({ queryKey: ['book-previews'] });
        } catch (e) { setError((e as Error).message); }
        finally { setBusy(false); }
    }
    async function upload(file: File | undefined) {
        if (!file) return;
        setBusy(true); setError('');
        try {
            const data = new FormData(); data.set('file', file);
            const result = await previewRequest('/api/previews/assets', { method: 'POST', body: data });
            setDraft(p => ({ ...p, coverSource: 'preview', coverPath: result.path }));
            setMessage('Copertina caricata. Salva l’anteprima per usarla.');
            await refreshAssets();
        } catch (e) { setError((e as Error).message); }
        finally { setBusy(false); }
    }
    async function uploadPages(files: File[]) {
        if (!files.length) return;
        if (draft.extractImagePaths.length + files.length > 50) {
            setError('Puoi selezionare al massimo 50 pagine.'); return;
        }
        setBusy(true); setError(''); setMessage('');
        const failures: string[] = [];
        let uploaded = 0;
        for (const [index, file] of files.entries()) {
            setUploadProgress(`Caricamento pagina ${index + 1} di ${files.length}…`);
            try {
                const data = new FormData(); data.set('file', file);
                const result = await previewRequest(`/api/previews/assets?source=pages&bookId=${encodeURIComponent(book.id)}`, { method: 'POST', body: data });
                setDraft(previous => ({ ...previous, extractImagePaths: [...previous.extractImagePaths, result.path] }));
                setAssets(previous => ({ ...previous, pages: [...previous.pages, result.path] }));
                uploaded++;
            } catch (error) { failures.push(`${file.name}: ${(error as Error).message}`); }
        }
        if (uploaded) setMessage(`${uploaded} ${uploaded === 1 ? 'pagina caricata e selezionata' : 'pagine caricate e selezionate'}. Controlla l’ordine e salva l’anteprima.`);
        if (failures.length) setError(failures.join(' '));
        setUploadProgress(''); setBusy(false);
    }
    function move(index: number, delta: number) {
        const pages = [...draft.extractImagePaths];
        [pages[index], pages[index + delta]] = [pages[index + delta], pages[index]];
        change('extractImagePaths', pages);
    }
    function addPage(file: string) {
        setDraft(previous => previous.extractImagePaths.includes(file) || previous.extractImagePaths.length >= 50
            ? previous
            : { ...previous, extractImagePaths: [...previous.extractImagePaths, file] });
        setMessage('');
    }
    const resolved = publicPreview({ ...draft, bookId: book.id, bookCover });
    const resolvedCoverUrl = !draft.coverSource || draft.coverPath ? resolved.coverUrl : null;
    const unselectedPages = assets.pages.filter(path => !draft.extractImagePaths.includes(path));
    const coverOptions = draft.coverSource ? assets[draft.coverSource] : [];
    return <section className="space-y-5 border-t pt-5" aria-label="Anteprima del libro" onKeyDown={event => {
        // This section has its own save action inside the book form. Enter in a
        // preview input must never submit the parent book's form implicitly.
        if (event.key === 'Enter' && (event.target as HTMLElement).closest('input, select')) event.preventDefault();
    }}>
        <h2 className="text-xl font-semibold">Anteprima del libro</h2>
        <p className="text-sm text-muted-foreground">Questa anteprima ha contenuti e visibilità indipendenti. Il salvataggio non modifica il libro. Il flag “Preview Book” del libro continua a escluderlo dalla biblioteca ordinaria.</p>
        {migrationRequired && <p role="status" className="rounded border border-amber-500 p-3 text-sm">La tabella delle anteprime non è ancora disponibile. Puoi preparare e visualizzare i contenuti; per salvarli, esegui la migrazione delle anteprime dalla gestione migrazioni e ricarica questa pagina.</p>}
        {loading ? <p>Caricamento anteprima…</p> : !ready ? <Button type="button" onClick={load}>Riprova caricamento anteprima</Button> : <fieldset disabled={busy} className="space-y-5">
            <label className="block space-y-2"><span>Titolo anteprima</span><Input value={draft.title} onChange={e => change('title', e.target.value)} /></label>
            <label className="flex items-center gap-3"><Switch className="data-[state=checked]:bg-green-500" checked={draft.isVisible} onCheckedChange={v => change('isVisible', v)} />Visibile in homepage</label>
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2"><span>Pubblicazione sul sito entro il (facoltativa)</span><Input type="date" value={draft.expectedPublicationDate || ''} onChange={e => change('expectedPublicationDate', e.target.value || null)} /></label>
                <label className="space-y-2"><span>Ordine (facoltativo)</span><Input type="number" value={draft.displayOrder ?? ''} onChange={e => change('displayOrder', e.target.value === '' ? null : Number(e.target.value))} /></label>
            </div>
            <div className="space-y-3 rounded-lg border p-4 sm:p-5">
                <label className="block space-y-2"><span>Copertina</span><select className="w-full rounded border bg-background p-2" value={draft.coverSource || 'auto'} onChange={e => setDraft(p => ({ ...p, coverSource: e.target.value === 'auto' ? null : e.target.value as 'book' | 'preview', coverPath: null }))}>
                    <option value="auto">Usa la copertina del libro, se disponibile</option><option value="preview">Scegli una copertina anteprima</option><option value="book">Scegli una copertina libro</option>
                </select></label>
                {draft.coverSource && <>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1"><PreviewAssetPicker
                            files={coverOptions} value={draft.coverPath} label="File copertina" disabled={busy}
                            onSelect={file => change('coverPath', file || null)}
                            imageUrl={file => previewAssetUrl(draft.coverSource!, file)}
                            emptyMessage="Nessuna copertina disponibile in questa raccolta."
                        /></div>
                        <Button type="button" variant="outline" className="shrink-0" onClick={() => { setError(''); void refreshAssets().catch(e => setError(e.message)); }}>Aggiorna copertine disponibili</Button>
                    </div>
                    {assetsLoaded && draft.coverPath && !coverOptions.includes(draft.coverPath) && <p className="text-sm text-destructive">File mancante: {draft.coverPath}. Seleziona un’altra copertina o caricala nuovamente.</p>}
                </>}
                {draft.coverSource === 'preview' && <label className="block space-y-2"><span>Carica copertina (JPEG, PNG, WebP; massimo 10 MB)</span><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></label>}
                {resolvedCoverUrl && <Thumbnail url={resolvedCoverUrl} label="Copertina risolta" />}
            </div>
            <div className={`rounded-lg border p-4 sm:p-5 ${draft.videoEnabled ? 'border-primary/40' : 'border-border'}`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <label htmlFor={`preview-video-${book.id}`} className="font-semibold">Video</label>
                        <p className="text-sm text-muted-foreground">Mostra un video insieme ai contenuti dell’anteprima.</p>
                    </div>
                    <Switch id={`preview-video-${book.id}`} aria-controls={`preview-video-fields-${book.id}`} aria-expanded={draft.videoEnabled} className="shrink-0 data-[state=checked]:bg-green-500" checked={draft.videoEnabled} onCheckedChange={v => change('videoEnabled', v)} />
                </div>
            {draft.videoEnabled && <div id={`preview-video-fields-${book.id}`} className="mt-5 space-y-5 border-t pt-5">
                <div className="space-y-2">
                    <label className="block" htmlFor={`preview-media-title-${book.id}`}>Media Title (optional)</label>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input id={`preview-media-title-${book.id}`} className="min-w-0 flex-1 basis-48" placeholder="Mux media title" value={draft.videoTitle || ''} onChange={e => change('videoTitle', e.target.value || null)} />
                        <Button type="button" variant="outline" size="sm" onClick={() => change('videoTitle', book.title.trim() || null)}>Use Book Title</Button>
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-2"><span>Media ID</span><Input aria-required="true" placeholder="Mux playback ID" value={draft.videoPlaybackId || ''} onChange={e => change('videoPlaybackId', e.target.value || null)} /><span className="block text-xs text-muted-foreground">Obbligatorio quando il video è abilitato.</span></label>
                    <label className="block space-y-2"><span>Media UserID (optional)</span><Input placeholder="Viewer user id" value={draft.videoViewerUid || ''} onChange={e => change('videoViewerUid', e.target.value || null)} /></label>
                </div>
                {resolvedCoverUrl && <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <div><p className="text-sm font-medium">Posizione rispetto alla copertina</p><p className="text-xs text-muted-foreground">Su schermi piccoli i contenuti si dispongono in verticale.</p></div>
                    <div role="group" aria-label="Posizione del video" className="inline-flex rounded-md border p-1">
                        <Button type="button" size="sm" variant={draft.videoPlacement === 'left' ? 'secondary' : 'ghost'} aria-pressed={draft.videoPlacement === 'left'} onClick={() => change('videoPlacement', 'left')}>A sinistra</Button>
                        <Button type="button" size="sm" variant={draft.videoPlacement === 'right' ? 'secondary' : 'ghost'} aria-pressed={draft.videoPlacement === 'right'} onClick={() => change('videoPlacement', 'right')}>A destra</Button>
                    </div>
                </div>}
            </div>}
            </div>
            <div className={`rounded-lg border p-4 sm:p-5 ${draft.extractEnabled ? 'border-primary/40' : 'border-border'}`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <label htmlFor={`preview-extract-${book.id}`} className="font-semibold">Estratto</label>
                        <p className="text-sm text-muted-foreground">Mostra un estratto del libro, come testo o immagini.</p>
                    </div>
                    <Switch id={`preview-extract-${book.id}`} aria-controls={`preview-extract-fields-${book.id}`} aria-expanded={draft.extractEnabled} className="shrink-0 data-[state=checked]:bg-green-500" checked={draft.extractEnabled} onCheckedChange={v => change('extractEnabled', v)} />
                </div>
            {draft.extractEnabled && <div id={`preview-extract-fields-${book.id}`} className="mt-5 space-y-5 border-t pt-5">
                <label className="block space-y-2"><span>Origine estratto</span><select className="w-full rounded border bg-background p-2 sm:w-auto sm:min-w-48 sm:block" value={draft.extractSource} onChange={e => change('extractSource', e.target.value as 'text' | 'images')}><option value="text">Testo</option><option value="images">Immagini</option></select></label>
                {draft.extractSource === 'text' ? <label className="block space-y-2"><span>HTML dell’estratto</span><Textarea rows={10} className="font-mono" value={draft.extractHtml || ''} onChange={e => change('extractHtml', e.target.value || null)} /><span className="block text-sm text-muted-foreground">Il testo è interpretato come HTML. Usa &lt;p&gt; per i paragrafi e &lt;br&gt; per gli a capo.</span></label> : <>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1"><PreviewAssetPicker
                            files={unselectedPages} label="Pagine disponibili" placeholder="Seleziona una pagina"
                            disabled={busy || draft.extractImagePaths.length >= 50}
                            onSelect={addPage}
                            imageUrl={file => previewAssetUrl('pages', file, book.id)}
                            emptyMessage={assets.pages.length ? 'Tutte le pagine disponibili sono già selezionate.' : 'Nessuna pagina disponibile. Carica le immagini qui sotto.'}
                        /></div>
                        <Button type="button" variant="outline" className="shrink-0" onClick={() => { setError(''); void refreshAssets().catch(error => setError(error.message)); }}>Aggiorna pagine disponibili</Button>
                    </div>
                    <label className="block space-y-2"><span>Carica immagini dell’estratto</span>
                        <Input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={event => {
                            const files = Array.from(event.target.files || []);
                            event.target.value = ''; void uploadPages(files);
                        }} />
                    </label>
                    <p className="text-sm text-muted-foreground">Scegli una o più immagini JPEG, PNG o WebP (massimo 10 MB e 40 megapixel ciascuna). Le pagine caricate vengono selezionate automaticamente, mantenendo la risoluzione originale. Riordinale e salva l’anteprima.</p>
                    {uploadProgress && <p role="status">{uploadProgress}</p>}
                    {draft.extractImagePaths.length >= 50 && <p className="text-sm text-muted-foreground">Hai selezionato il massimo di 50 pagine. Rimuovine una prima di aggiungerne altre.</p>}
                    {draft.extractImagePaths.length > 0 && <><p>{draft.extractImagePaths.length} {draft.extractImagePaths.length === 1 ? 'pagina selezionata' : 'pagine selezionate'}</p>
                    <ol className="space-y-2">{draft.extractImagePaths.map((file, index) => <li key={file} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded border p-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                        <Thumbnail url={previewAssetUrl('pages', file, book.id)} label={`Pagina ${index + 1}`} />
                        <span className="min-w-0 break-all">{index + 1}. {file}{assetsLoaded && !assets.pages.includes(file) && <strong className="block text-destructive">File mancante</strong>}</span>
                        <div className="col-span-2 flex justify-end gap-2 sm:col-span-1">
                        {draft.extractImagePaths.length > 1 && <><Button type="button" variant="outline" size="sm" aria-label={`Sposta ${file} su`} disabled={index === 0} onClick={() => move(index, -1)}>↑</Button>
                        <Button type="button" variant="outline" size="sm" aria-label={`Sposta ${file} giù`} disabled={index === draft.extractImagePaths.length - 1} onClick={() => move(index, 1)}>↓</Button></>}
                        <Button type="button" variant="outline" size="sm" onClick={() => change('extractImagePaths', draft.extractImagePaths.filter(p => p !== file))}>Rimuovi</Button>
                        </div>
                    </li>)}</ol></>}
                    {assetsLoaded && !assets.pages.length && <p>Nessuna pagina disponibile: carica le immagini dell’estratto qui sopra.</p>}
                </>}
            </div>}
            </div>
            <div className="flex flex-wrap gap-3">
                <Button type="button" disabled={migrationRequired} onClick={save}>{busy ? 'Salvataggio…' : 'Salva anteprima'}</Button>
                <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
                    <DialogTrigger asChild><Button type="button" variant="outline" onClick={() => setInspection(resolved)}>Visualizza anteprima</Button></DialogTrigger>
                    {inspectOpen && inspection && <BookPreviewDialogContent preview={inspection} />}
                </Dialog>
            </div>
        </fieldset>}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {message && <p role="status" className="text-green-700 dark:text-green-400">{message}</p>}
    </section>;
}

function Thumbnail({ url, label }: { url: string; label: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={label} loading="lazy" className="h-24 max-w-24 rounded object-contain" />;
}
