'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import type { PublicBookPreview } from '@/types/book-preview';
import { publicationAnnouncement } from '@/lib/book-preview';
import { sanitizePreviewHtml } from '@/lib/preview-html';
import { readingFontClass } from '@/config/fonts';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PreviewExtractReader } from './preview-extract-reader';
import { DEFAULT_COVER_SIZES } from '@/types/images';

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false });

// A book has crisp corners and casts a real shadow. --radius is 1rem here, so the
// rounded-* scale is far too soft for artwork; dark mode leans on the ring because
// black shadows vanish against a near-black background.
const COVER_ELEVATION = [
    // Shorter than the card's max-h-80: the dialog has to leave room to actually read.
    'max-h-64 sm:max-h-72 rounded-[3px] ring-1 ring-black/10 dark:ring-white/10',
    'shadow-[0_1px_2px_rgb(0_0_0/0.12),0_10px_24px_-8px_rgb(0_0_0/0.35),0_28px_48px_-24px_rgb(0_0_0/0.30)]',
    'dark:shadow-[0_1px_2px_rgb(0_0_0/0.6),0_14px_30px_-10px_rgb(0_0_0/0.8)]',
].join(' ');

// sanitizePreviewHtml strips class and style, so this wrapper is the only styling
// surface for the injected markup. Keep every rule here: the same dialog also renders
// PreviewExtractReader, whose chrome is plain light DOM and would be caught by any
// descendant selector placed further up the tree.
const EXTRACT_CLASSES = [
    // Reading column. max-w and the serif face must share one element: ch resolves
    // against that element's own font.
    // pb clears the h-10 scroll fade: at full scroll the gradient then sits over
    // empty margin instead of dimming the closing line, while still veiling text mid-scroll.
    'mx-auto w-full min-w-0 max-w-[66ch] break-words pb-12 text-left sm:pb-16',
    readingFontClass,
    'text-[1.0625rem] leading-[1.75] text-foreground/90 [text-wrap:pretty]',

    // A bare <em> first child is the authored standfirst. Kept below the dialog
    // heading in size: it repeats the title, so it reads as a title-page flourish.
    '[&>em:first-child]:mb-2 [&>em:first-child]:block [&>em:first-child]:text-center',
    '[&>em:first-child]:text-xl sm:[&>em:first-child]:text-2xl',
    '[&>em:first-child]:leading-snug [&>em:first-child]:text-foreground',

    // Deck: the paragraph immediately after the standfirst, set small in sans.
    '[&>em:first-child+p]:mt-0 [&>em:first-child+p]:mb-9 [&>em:first-child+p]:pb-7',
    '[&>em:first-child+p]:border-b [&>em:first-child+p]:border-border/70 dark:[&>em:first-child+p]:border-white/10',
    '[&>em:first-child+p]:text-center [&>em:first-child+p]:text-[0.6875rem] [&>em:first-child+p]:font-medium',
    '[&>em:first-child+p]:uppercase [&>em:first-child+p]:tracking-[0.2em] [&>em:first-child+p]:text-muted-foreground',
    '[&>em:first-child+p]:font-[family-name:var(--font-base),ui-sans-serif,system-ui,sans-serif]',

    // Lead paragraph and drop cap. min-h keeps the floated cap inside its own
    // paragraph when the lead is a single line, as it is here.
    '[&>em:first-child+p+p]:mt-0 [&>em:first-child+p+p]:min-h-[3rem] sm:[&>em:first-child+p+p]:min-h-[4rem]',
    '[&>em:first-child+p+p]:text-[1.1875rem] [&>em:first-child+p+p]:leading-[1.6] [&>em:first-child+p+p]:text-foreground',
    '[&>em:first-child+p+p]:first-letter:float-left [&>em:first-child+p+p]:first-letter:mr-[0.35rem]',
    '[&>em:first-child+p+p]:first-letter:mt-[0.1rem] [&>em:first-child+p+p]:first-letter:text-[3.25rem]',
    'sm:[&>em:first-child+p+p]:first-letter:text-[4.5rem]',
    '[&>em:first-child+p+p]:first-letter:leading-[0.72] [&>em:first-child+p+p]:first-letter:font-medium',
    '[&>em:first-child+p+p]:first-letter:text-foreground',

    // Same treatment when an extract opens with a bare <p> instead of a standfirst.
    // Mutually exclusive with the rules above, so both can coexist.
    '[&>p:first-child]:min-h-[3rem] sm:[&>p:first-child]:min-h-[4rem]',
    '[&>p:first-child]:text-[1.1875rem] [&>p:first-child]:leading-[1.6] [&>p:first-child]:text-foreground',
    '[&>p:first-child]:first-letter:float-left [&>p:first-child]:first-letter:mr-[0.35rem]',
    '[&>p:first-child]:first-letter:mt-[0.1rem] [&>p:first-child]:first-letter:text-[3.25rem]',
    'sm:[&>p:first-child]:first-letter:text-[4.5rem]',
    '[&>p:first-child]:first-letter:leading-[0.72] [&>p:first-child]:first-letter:font-medium',
    '[&>p:first-child]:first-letter:text-foreground',

    // Body blocks. Headings take more space above than below so they bind to what follows.
    '[&_p]:my-5',
    '[&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground',
    '[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground',
    '[&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-foreground',
    '[&_h5]:mt-6 [&_h5]:mb-2 [&_h5]:text-base [&_h5]:font-semibold [&_h5]:text-foreground',
    '[&_h6]:mt-6 [&_h6]:mb-2 [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:uppercase [&_h6]:tracking-[0.12em] [&_h6]:text-muted-foreground',
    '[&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6',
    '[&_li]:my-2 [&_li]:pl-1 [&_li]:marker:text-muted-foreground',
    '[&_blockquote]:my-8 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-5',
    '[&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote_p]:my-2',
    '[&_hr]:mx-auto [&_hr]:my-10 [&_hr]:w-20 [&_hr]:border-t [&_hr]:border-border',

    // Inline. strong reads as a louder tier because the body sits at foreground/90.
    '[&_strong]:font-semibold [&_strong]:text-foreground [&_b]:font-semibold [&_b]:text-foreground',
    '[&_u]:underline [&_u]:decoration-1 [&_u]:underline-offset-2 [&_s]:text-muted-foreground',
    '[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/40 [&_a]:underline-offset-[3px]',
    '[&_a:hover]:decoration-primary',

    // Colophon rule under the closing line. Deliberately mild so an ordinary final
    // paragraph still reads acceptably.
    '[&>p:last-child]:mt-9 [&>p:last-child]:mb-0 [&>p:last-child]:pt-6',
    '[&>p:last-child]:border-t [&>p:last-child]:border-border/70 dark:[&>p:last-child]:border-white/10',
    '[&>p:last-child]:text-center [&>p:last-child]:text-sm [&>p:last-child]:text-muted-foreground',
].join(' ');

function Cover({ url, title, compact = false, className }: { url: string; title: string; compact?: boolean; className?: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={`Copertina di ${title}`} className={cn('mx-auto max-h-80 max-w-full rounded object-contain', className)} style={compact ? DEFAULT_COVER_SIZES.list : undefined} />;
}

export function PreviewHtmlExtract({ html }: { html: string }) {
    return <div className={EXTRACT_CLASSES} dangerouslySetInnerHTML={{ __html: sanitizePreviewHtml(html) }} />;
}

export function BookPreviewDialogContent({ preview }: { preview: PublicBookPreview }) {
    const title = useRef<HTMLHeadingElement>(null);
    const player = useRef<ComponentRef<typeof import('@mux/mux-player-react').default>>(null);
    const attachPlayer = useCallback((element: ComponentRef<typeof import('@mux/mux-player-react').default> | null) => {
        if (!element) player.current?.pause();
        player.current = element;
    }, []);
    return <DialogContent className="max-w-5xl outline-none" overlayClassName="bg-black/50 backdrop-blur-[2px] dark:bg-black/65" aria-describedby={undefined}
        onOpenAutoFocus={event => {
            // Start at the title instead of outlining the reader or close button.
            event.preventDefault();
            title.current?.focus({ preventScroll: true });
        }}>
        {/* Padding is restated at every breakpoint the primitive defines: unprefixed
            utilities are emitted before each media block, so a bare pr-* would lose to
            the header's own sm:/md: padding and let the title slide under the close button. */}
        <DialogHeader className="items-start border-b border-border/70 bg-muted/60 px-4 pb-3 pr-12 pt-3 text-left dark:border-white/10 dark:bg-muted/25 sm:px-6 sm:pb-3.5 sm:pr-14 sm:pt-3.5 md:px-7 md:pb-4 md:pr-14 md:pt-4">
            <DialogTitle ref={title} tabIndex={-1} className="max-h-24 overflow-auto break-words text-lg font-semibold leading-snug tracking-tight outline-none sm:text-xl md:text-2xl">{preview.title}</DialogTitle>
            {preview.expectedPublicationDate && <p className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">{publicationAnnouncement(preview.expectedPublicationDate)}</p>}
        </DialogHeader>
        <div className="relative min-h-0 overflow-y-auto overscroll-contain outline-none">
            {(preview.coverUrl || preview.video) && <div className="flex flex-wrap items-start justify-center gap-6 border-b border-border/70 bg-muted/40 px-4 py-6 dark:border-white/10 dark:bg-muted/20 sm:px-6">
                {preview.coverUrl && <Cover url={preview.coverUrl} title={preview.title} className={COVER_ELEVATION} />}
                {preview.video && <div className="w-full min-w-0 max-w-xl"><MuxPlayer ref={attachPlayer} playbackId={preview.video.playbackId} preload="none" metadata={{ video_title: preview.video.title, viewer_user_id: preview.video.viewerUid || undefined }} /></div>}
            </div>}
            {/* p-4 sm:p-6 repeats what the scroll container used to carry, so the image
                reader still measures exactly the width it did before. */}
            {preview.extract && <section aria-label="Estratto" className="p-4 sm:p-6">
                {preview.extract.source === 'text' ? <PreviewHtmlExtract html={preview.extract.html} /> : <PreviewExtractReader images={preview.extract.images} title={preview.title} />}
            </section>}
        </div>
        {/* Absolute, not sticky: a sticky child stays in flow, adds height and jitters
            against overscroll-contain. Text extracts only, so it never tints the video
            controls or the reader's hint line. */}
        {preview.extract?.source === 'text' && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background via-background/70 to-transparent" />}
    </DialogContent>;
}

export function BookPreviewCard({ preview }: { preview: PublicBookPreview }) {
    const [open, setOpen] = useState(false);
    const player = useRef<ComponentRef<typeof import('@mux/mux-player-react').default>>(null);
    const hasContent = !!(preview.video || preview.extract);
    return <Dialog open={open} onOpenChange={value => { if (value) player.current?.pause(); setOpen(value); }}>
        <article className="relative isolate min-w-0 max-w-full rounded-lg p-3 text-center transition-colors duration-200 hover:bg-accent/50 focus-within:bg-accent/50 motion-reduce:transition-none">
            <div className={`flex flex-col items-center justify-center gap-4 ${preview.video?.placement === 'left' ? 'sm:flex-row-reverse sm:items-start' : 'sm:flex-row sm:items-start'}`}>
                <div className="min-w-0 max-w-full space-y-2" style={{ width: DEFAULT_COVER_SIZES.list.width }}>
                    {preview.coverUrl && <Cover url={preview.coverUrl} title={preview.title} compact />}
                    {/* Stretch the single trigger across the card, keeping video controls above it. */}
                    <h3 className="break-words text-sm font-semibold" title={preview.title}>{hasContent ? <DialogTrigger asChild><button type="button" aria-label={`Apri anteprima di ${preview.title}`} className="w-full no-underline outline-none after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2"><span className="line-clamp-2">{preview.title}</span></button></DialogTrigger> : <span className="line-clamp-2">{preview.title}</span>}</h3>
                    {preview.expectedPublicationDate && <p className="text-sm text-muted-foreground">{publicationAnnouncement(preview.expectedPublicationDate)}</p>}
                </div>
                {preview.video && <div className="relative z-10 max-w-full min-w-0" style={{ width: DEFAULT_COVER_SIZES.video.width }}><MuxPlayer ref={player} style={{ width: '100%', height: DEFAULT_COVER_SIZES.video.height }} playbackId={preview.video.playbackId} preload="none" metadata={{ video_title: preview.video.title, viewer_user_id: preview.video.viewerUid || undefined }} /></div>}
            </div>
        </article>
        {open && <BookPreviewDialogContent preview={preview} />}
    </Dialog>;
}
