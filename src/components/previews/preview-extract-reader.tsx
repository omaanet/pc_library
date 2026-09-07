'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { canFitSpread, clampPan, spreadStart } from '@/lib/preview-reader';

export function PreviewExtractReader({ images, title }: { images: string[]; title: string }) {
    const viewport = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 550 });
    const [ratios, setRatios] = useState<Record<number, number>>({});
    const [loaded, setLoaded] = useState<Record<number, boolean>>({});
    const [failed, setFailed] = useState<Record<number, boolean>>({});
    const [retry, setRetry] = useState<Record<number, number>>({});
    const [page, setPage] = useState(0);
    const [mode, setMode] = useState<'auto' | 'single' | 'double'>('auto');
    const [transform, setTransform] = useState({ zoom: 1, x: 0, y: 0 });
    const points = useRef(new Map<number, { x: number; y: number }>());
    const possibleStart = spreadStart(page, true);
    const pair = images.slice(possibleStart, possibleStart + 2).map((_, i) => ratios[possibleStart + i] || 0.7);
    // Use the preceding pair for an odd final page so layout preference remains stable.
    const double = mode !== 'single' && images.length > 1 && canFitSpread(size.width, size.height, pair.length === 2 ? pair : [ratios[0] || 0.7, ratios[1] || 0.7]);
    const start = spreadStart(page, double);
    const active = images.slice(start, start + (double ? 2 : 1));
    const activeRatios = active.map((_, i) => ratios[start + i] || 0.7);
    const gap = active.length > 1 ? 12 : 0;
    const fitHeight = Math.max(1, Math.min(size.height, (size.width - gap) / activeRatios.reduce((a, b) => a + b, 0)));
    const content = { width: fitHeight * activeRatios.reduce((a, b) => a + b, 0) + gap, height: fitHeight };
    const fitWidthZoom = Math.max(1, size.width / content.width);
    // Start at the top when fitting the width makes the page taller than the viewport.
    const fitWidthY = Math.max(0, (content.height * fitWidthZoom - size.height) / 2);
    const maxZoom = Math.max(4, fitWidthZoom);
    const interaction = useRef({ transform, content, size, maxZoom });
    interaction.current = { transform, content, size, maxZoom };
    const resetZoom = useCallback(() => {
        const next = { zoom: fitWidthZoom, x: 0, y: fitWidthY };
        interaction.current.transform = next;
        setTransform(next);
        points.current.clear();
    }, [fitWidthZoom, fitWidthY]);

    useEffect(() => {
        if (!viewport.current) return;
        const observer = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setSize({ width, height });
        });
        observer.observe(viewport.current);
        return () => observer.disconnect();
    }, []);
    useEffect(() => { resetZoom(); }, [resetZoom, size.width, size.height, content.width, content.height, double, start]);
    useEffect(() => {
        // Discover the next page's real aspect ratio even when the provisional
        // layout is single. Otherwise two landscape pages could stay single
        // forever because the unseen page was estimated as portrait.
        const next = start + active.length;
        if (next >= images.length || ratios[next]) return;
        let cancelled = false;
        const image = new window.Image();
        image.onload = () => {
            if (!cancelled) setRatios(previous => ({ ...previous, [next]: image.naturalWidth / image.naturalHeight }));
        };
        image.src = images[next];
        return () => { cancelled = true; image.onload = null; };
    }, [images, start, active.length, ratios]);

    function zoomTo(zoom: number, anchor = { x: 0, y: 0 }) {
        const current = interaction.current;
        const nextZoom = Math.min(current.maxZoom, Math.max(1, zoom));
        const factor = nextZoom / current.transform.zoom;
        const pan = clampPan(anchor.x - (anchor.x - current.transform.x) * factor,
            anchor.y - (anchor.y - current.transform.y) * factor, nextZoom, current.content, current.size);
        const next = { zoom: nextZoom, ...pan };
        interaction.current.transform = next;
        setTransform(next);
    }
    function localPoint(clientX: number, clientY: number) {
        const rect = viewport.current!.getBoundingClientRect();
        return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
    }
    useEffect(() => {
        const element = viewport.current;
        if (!element) return;
        const wheel = (event: WheelEvent) => {
            if (!event.ctrlKey && !event.metaKey) return;
            event.preventDefault();
            zoomTo(interaction.current.transform.zoom * Math.exp(-event.deltaY * 0.005), localPoint(event.clientX, event.clientY));
        };
        element.addEventListener('wheel', wheel, { passive: false });
        return () => element.removeEventListener('wheel', wheel);
    }, []);
    function navigate(direction: number) {
        setPage(Math.max(0, Math.min(images.length - 1, start + direction * (double ? 2 : 1))));
    }

    return <div className="space-y-2 outline-none" tabIndex={0} role="region" aria-label={`Lettore estratto di ${title}`}
        onKeyDown={event => {
            if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable=true]')) return;
            if (['+', '=', '-', '0'].includes(event.key)) {
                event.preventDefault();
                if (event.key === '0') resetZoom();
                else zoomTo(transform.zoom + (event.key === '-' ? -0.25 : 0.25));
            } else if (images.length > 1 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
                event.preventDefault(); navigate(event.key === 'ArrowLeft' ? -1 : 1);
            }
        }}>
        <div className="flex flex-wrap items-center justify-end gap-2">
            {images.length > 1 && <>
                <Button type="button" size="sm" variant="outline" aria-label="Pagina precedente" disabled={start === 0} onClick={() => navigate(-1)}>←</Button>
                <span className="text-sm" aria-live="polite">{start + 1}{active.length > 1 ? `–${start + active.length}` : ''} / {images.length}</span>
                <Button type="button" size="sm" variant="outline" aria-label="Pagina successiva" disabled={start + active.length >= images.length} onClick={() => navigate(1)}>→</Button>
                <select className="max-w-full rounded border bg-background p-2 text-sm" aria-label="Disposizione pagine" value={mode} onChange={e => setMode(e.target.value as typeof mode)}>
                    <option value="auto">Automatico</option><option value="single">Pagina singola</option><option value="double">Pagina doppia</option>
                </select>
            </>}
            <Button type="button" size="sm" variant="outline" aria-label="Riduci zoom" disabled={transform.zoom <= 1} onClick={() => zoomTo(transform.zoom - 0.25)}>−</Button>
            <Button type="button" size="sm" variant="ghost" aria-label="Ripristina zoom" title="Adatta alla larghezza" onClick={resetZoom}>{Math.round(transform.zoom * 100)}%</Button>
            <Button type="button" size="sm" variant="outline" aria-label="Aumenta zoom" disabled={transform.zoom >= maxZoom} onClick={() => zoomTo(transform.zoom + 0.25)}>+</Button>
        </div>
        <div ref={viewport} className="relative flex h-[min(65vh,700px)] min-h-[240px] items-center justify-center overflow-hidden rounded bg-muted/40"
            style={{ touchAction: 'none', cursor: transform.zoom > 1 ? 'grab' : 'default' }}
            onPointerDown={event => {
                if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
                points.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
                event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={event => {
                const old = points.current.get(event.pointerId);
                if (!old) return;
                const before = [...points.current.values()];
                points.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
                const after = [...points.current.values()];
                if (after.length === 2) {
                    const distance = (p: typeof after) => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
                    const midpoint = (p: typeof after) => localPoint((p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2);
                    const a = midpoint(before), b = midpoint(after);
                    zoomTo(interaction.current.transform.zoom * distance(after) / Math.max(1, distance(before)), a);
                    const current = interaction.current;
                    const next = { zoom: current.transform.zoom, ...clampPan(current.transform.x + b.x - a.x, current.transform.y + b.y - a.y, current.transform.zoom, current.content, current.size) };
                    interaction.current.transform = next; setTransform(next);
                } else if (after.length === 1 && interaction.current.transform.zoom > 1) {
                    const current = interaction.current;
                    const next = { zoom: current.transform.zoom, ...clampPan(current.transform.x + event.clientX - old.x, current.transform.y + event.clientY - old.y, current.transform.zoom, current.content, current.size) };
                    interaction.current.transform = next; setTransform(next);
                }
            }}
            onPointerUp={event => points.current.delete(event.pointerId)}
            onPointerCancel={event => points.current.delete(event.pointerId)}
            onLostPointerCapture={event => points.current.delete(event.pointerId)}>
            <div className="flex shrink-0 items-center justify-center gap-3" style={{ width: content.width, height: content.height, transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})` }}>
                {active.map((url, i) => {
                    const index = start + i;
                    return <div key={url} className="relative shrink-0" style={{ width: fitHeight * activeRatios[i], height: fitHeight }}>
                        {!loaded[index] && !failed[index] && <span className="absolute inset-0 flex items-center justify-center text-sm" role="status">Caricamento pagina {index + 1}…</span>}
                        {failed[index] ? <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center"><p>Pagina {index + 1} non disponibile.</p><Button type="button" variant="outline" onClick={() => { setFailed(v => ({ ...v, [index]: false })); setRetry(v => ({ ...v, [index]: (v[index] || 0) + 1 })); }}>Riprova pagina {index + 1}</Button></div> :
                            // Native images preserve prepared page resolution and load only this spread.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={retry[index] || 0} src={url + (retry[index] ? `?retry=${retry[index]}` : '')} alt={`Estratto di ${title}, pagina ${index + 1} di ${images.length}`} draggable={false} className="h-full w-full select-none object-contain"
                                onLoad={e => { const ratio = e.currentTarget.naturalWidth / e.currentTarget.naturalHeight; setRatios(v => ({ ...v, [index]: ratio })); setLoaded(v => ({ ...v, [index]: true })); }}
                                onError={() => setFailed(v => ({ ...v, [index]: true }))} />}
                    </div>;
                })}
            </div>
        </div>
        <p className="text-xs text-muted-foreground">Zoom: + / −, Ctrl o ⌘ + rotella, oppure pizzica l’immagine. Trascina per spostarla; 0 adatta alla larghezza.</p>
    </div>;
}
