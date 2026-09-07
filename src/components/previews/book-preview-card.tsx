'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import type { PublicBookPreview } from '@/types/book-preview';
import { publicationAnnouncement } from '@/lib/book-preview';
import { sanitizePreviewHtml } from '@/lib/preview-html';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PreviewExtractReader } from './preview-extract-reader';
import { DEFAULT_COVER_SIZES } from '@/types/images';

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false });

function Cover({ url, title, compact = false }: { url: string; title: string; compact?: boolean }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={`Copertina di ${title}`} className="mx-auto max-h-80 max-w-full rounded object-contain" style={compact ? DEFAULT_COVER_SIZES.list : undefined} />;
}

export function PreviewHtmlExtract({ html }: { html: string }) {
    return <div className="w-full min-w-0 break-words text-left leading-relaxed [&_p]:my-4 [&_h2]:my-5 [&_h2]:text-2xl [&_h3]:my-4 [&_h3]:text-xl [&_h4]:my-3 [&_h4]:font-semibold [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_a]:text-primary [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: sanitizePreviewHtml(html) }} />;
}

export function BookPreviewDialogContent({ preview }: { preview: PublicBookPreview }) {
    const title = useRef<HTMLHeadingElement>(null);
    const player = useRef<ComponentRef<typeof import('@mux/mux-player-react').default>>(null);
    const attachPlayer = useCallback((element: ComponentRef<typeof import('@mux/mux-player-react').default> | null) => {
        if (!element) player.current?.pause();
        player.current = element;
    }, []);
    return <DialogContent className="max-w-5xl outline-none" aria-describedby={undefined}
        onOpenAutoFocus={event => {
            // Start at the title instead of outlining the reader or close button.
            event.preventDefault();
            title.current?.focus({ preventScroll: true });
        }}>
        <DialogHeader className="pr-12"><DialogTitle ref={title} tabIndex={-1} className="max-h-24 overflow-auto break-words leading-snug outline-none">{preview.title}</DialogTitle>
            {preview.expectedPublicationDate && <p className="text-sm text-muted-foreground">{publicationAnnouncement(preview.expectedPublicationDate)}</p>}
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-4 outline-none sm:p-6">
            {(preview.coverUrl || preview.video) && <div className="mb-6 flex flex-wrap items-start justify-center gap-6">
                {preview.coverUrl && <Cover url={preview.coverUrl} title={preview.title} />}
                {preview.video && <div className="w-full min-w-0 max-w-xl"><MuxPlayer ref={attachPlayer} playbackId={preview.video.playbackId} preload="none" metadata={{ video_title: preview.video.title, viewer_user_id: preview.video.viewerUid || undefined }} /></div>}
            </div>}
            {preview.extract && <section aria-label="Estratto">
                {preview.extract.source === 'text' ? <PreviewHtmlExtract html={preview.extract.html} /> : <PreviewExtractReader images={preview.extract.images} title={preview.title} />}
            </section>}
        </div>
    </DialogContent>;
}

export function BookPreviewCard({ preview }: { preview: PublicBookPreview }) {
    const [open, setOpen] = useState(false);
    const player = useRef<ComponentRef<typeof import('@mux/mux-player-react').default>>(null);
    const hasContent = !!(preview.video || preview.extract);
    return <Dialog open={open} onOpenChange={value => { if (value) player.current?.pause(); setOpen(value); }}>
        <article className="relative isolate min-w-0 max-w-full rounded-lg p-3 text-center transition-colors duration-200 hover:bg-accent/50 focus-within:bg-accent/50 motion-reduce:transition-none">
            <div className={`flex flex-col items-center justify-center gap-4 ${preview.video?.placement === 'left' ? 'sm:flex-row-reverse sm:items-start' : 'sm:flex-row sm:items-start'}`}>
                <div className="max-w-full space-y-2 sm:max-w-64">
                    {preview.coverUrl && <Cover url={preview.coverUrl} title={preview.title} compact />}
                    {/* Stretch the single trigger across the card, keeping video controls above it. */}
                    <h3 className="break-words text-sm font-semibold">{hasContent ? <DialogTrigger asChild><button type="button" aria-label={`Apri anteprima di ${preview.title}`} className="no-underline outline-none after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2">{preview.title}</button></DialogTrigger> : preview.title}</h3>
                    {preview.expectedPublicationDate && <p className="text-sm text-muted-foreground">{publicationAnnouncement(preview.expectedPublicationDate)}</p>}
                </div>
                {preview.video && <div className="relative z-10 max-w-full min-w-0" style={{ width: DEFAULT_COVER_SIZES.video.width }}><MuxPlayer ref={player} style={{ width: '100%', height: DEFAULT_COVER_SIZES.video.height }} playbackId={preview.video.playbackId} preload="none" metadata={{ video_title: preview.video.title, viewer_user_id: preview.video.viewerUid || undefined }} /></div>}
            </div>
        </article>
        {open && <BookPreviewDialogContent preview={preview} />}
    </Dialog>;
}
