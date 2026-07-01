'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ClientSanitizedHtml } from '@/components/promo/ClientSanitizedHtml';
import { PromoAudioTypeLabel } from '@/components/promo/PromoAudioTypeLabel';
import { PromoAudioPlayer } from '@/components/promo/PromoAudioPlayer';
import { PromoHomeLink } from '@/components/promo/PromoHomeLink';
import { getCoverImageUrl } from '@/lib/image-utils';
import { displayFontClass } from '@/config/fonts';
import type { Book, PromoPage } from '@/types';

interface PromoPageModernViewProps {
    promoPage: PromoPage;
    book: Book;
    disableTracking?: boolean;
}

function formatPublishingDate(value: string | null | undefined): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('it-IT', { year: 'numeric', month: 'long' }).format(date);
}

/**
 * Reveal-on-scroll wrapper. Fades and lifts its children into view once, the
 * first time they intersect the viewport. Motion is disabled automatically for
 * users who prefer reduced motion (handled in the CSS below).
 */
function Reveal({
    children,
    className = '',
    delay = 0,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        // If the element is already in view on mount (or IO is unavailable),
        // reveal immediately so nothing stays stuck hidden.
        if (typeof IntersectionObserver === 'undefined') {
            setVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisible(true);
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`promo-reveal ${visible ? 'is-visible' : ''} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

export function PromoPageModernView({ promoPage, book, disableTracking = false }: PromoPageModernViewProps) {
    const coverUrl = useMemo(
        () => getCoverImageUrl(book.coverImage, 'detail', { bookId: book.id }),
        [book.coverImage, book.id]
    );

    const description = book.extract || book.summary || null;
    const publishedLabel = formatPublishingDate(promoPage.publishingDateOverride ?? book.publishingDate);

    return (
        <main className="promo-modern relative min-h-screen w-full overflow-hidden bg-[#f4f1e2] text-[#3a3a2a]">
            <style>{PROMO_MODERN_CSS}</style>
            <PromoHomeLink className="bg-white/35 text-[#3f4d2e] shadow-sm ring-1 ring-white/55 backdrop-blur-md hover:bg-white/55 focus-visible:ring-[#9caf6a]" />

            {/* Floating warm/sage ambient glows */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="promo-blob promo-blob--sage absolute -left-[10%] top-[-8%] h-[42vw] w-[42vw] max-h-[560px] max-w-[560px] rounded-full" />
                <div className="promo-blob promo-blob--gold absolute right-[-12%] top-[28%] h-[38vw] w-[38vw] max-h-[520px] max-w-[520px] rounded-full" />
                <div className="promo-blob promo-blob--olive absolute bottom-[-10%] left-[25%] h-[40vw] w-[40vw] max-h-[540px] max-w-[540px] rounded-full" />
            </div>

            <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-5 sm:px-8">
                {/* First viewport: keep the promo essentials together. */}
                <section className="promo-modern-hero flex min-h-svh w-full flex-col items-center justify-center gap-4 py-7 text-center sm:gap-5 sm:py-9">
                    <div className="w-full">
                        <Reveal>
                            <PromoAudioTypeLabel
                                audioType={promoPage.audioType}
                                variant="title"
                                className={`${displayFontClass} promo-modern-kicker text-[#9a7b3f]`}
                            />
                        </Reveal>
                        <Reveal delay={120}>
                            <h1 className="promo-modern-title mt-2 font-serif font-semibold leading-[1.04] tracking-normal text-[#2f3522] [text-wrap:balance]">
                                {book.title}
                            </h1>
                        </Reveal>
                        {publishedLabel && (
                            <Reveal delay={220}>
                                <p className="promo-modern-date mt-3 uppercase tracking-[0.32em] text-[#8a8463]">
                                    {publishedLabel}
                                </p>
                            </Reveal>
                        )}
                    </div>

                    <Reveal className="flex justify-center">
                        <div className="promo-cover-hover promo-modern-cover relative">
                            <div
                                aria-hidden
                                className="absolute -inset-6 rounded-[36px] bg-[#9caf6a]/30 blur-3xl"
                            />
                            {/* Frosted glass frame around the cover */}
                            <div className="relative rounded-[26px] border border-white/60 bg-white/30 p-3 shadow-[0_30px_70px_-25px_rgba(70,80,40,0.55)] backdrop-blur-md ring-1 ring-black/5">
                                <div className="overflow-hidden rounded-[16px] shadow-[0_18px_40px_-18px_rgba(60,55,25,0.6)]">
                                    <Image
                                        src={coverUrl}
                                        alt={`Copertina di ${book.title}`}
                                        width={400}
                                        height={600}
                                        className="h-auto w-full"
                                        priority
                                        unoptimized
                                    />
                                </div>
                            </div>
                        </div>
                    </Reveal>

                    <Reveal className="flex w-full justify-center">
                        <div className="w-full max-w-xl">
                            <PromoAudioTypeLabel
                                audioType={promoPage.audioType}
                                variant="listen"
                                className="promo-modern-listen-label mb-5 text-center text-xs uppercase tracking-[0.34em] text-[#7e7a55]"
                            />
                            {/* Deep-green frosted glass panel keeps the light-text player legible */}
                            <div className="promo-audio-glow relative rounded-[30px] border border-white/15 bg-gradient-to-b from-[#3a4a2f]/95 to-[#222c1a]/95 p-6 shadow-[0_40px_90px_-30px_rgba(34,44,26,0.8)] backdrop-blur-xl ring-1 ring-white/10 sm:p-8">
                                <PromoAudioPlayer
                                    promoPage={promoPage}
                                    book={book}
                                    unavailableClassName="py-8 text-center text-sm text-[#c9d3b0]"
                                    disableTracking={disableTracking}
                                />
                            </div>
                        </div>
                    </Reveal>
                </section>

                {/* Optional extract — secondary, never competes with the audio */}
                {description && (
                    <section className="w-full pb-24 sm:pb-32">
                        <Reveal className="flex justify-center">
                            <figure className="relative w-full max-w-xl rounded-[28px] border border-white/50 bg-white/35 p-8 text-center shadow-[0_24px_60px_-30px_rgba(70,80,40,0.45)] backdrop-blur-md sm:p-10">
                                <span aria-hidden className={`${displayFontClass} pointer-events-none absolute left-5 top-1 select-none text-5xl leading-none text-[#9caf6a]/50`}>
                                    &ldquo;
                                </span>
                                <ClientSanitizedHtml
                                    as="blockquote"
                                    html={description}
                                    className="relative text-base leading-relaxed text-[#4a4a35] sm:text-lg [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[#9caf6a]/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-left [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-left"
                                />
                            </figure>
                        </Reveal>
                    </section>
                )}

                {/* Minimal closing */}
                <footer className="pb-16 text-center">
                    <Reveal>
                        <p className={`${displayFontClass} text-2xl text-[#9a7b3f]`}>{book.title}</p>
                        {publishedLabel && (
                            <p className="mt-1 text-[0.7rem] uppercase tracking-[0.3em] text-[#a59f7d]">
                                {publishedLabel}
                            </p>
                        )}
                    </Reveal>
                </footer>
            </div>
        </main>
    );
}

/**
 * Scoped CSS for the modern promo template: ambient blob tints + drift, the
 * scroll-reveal transition, and a hover lift on the cover. All motion is
 * neutralized under prefers-reduced-motion.
 */
const PROMO_MODERN_CSS = `
.promo-modern .promo-blob { opacity: 0.55; filter: blur(8px); will-change: transform; }
.promo-modern .promo-blob--sage { background: radial-gradient(circle at 50% 50%, rgba(156,175,106,0.55), transparent 68%); animation: promoFloat 18s ease-in-out infinite; }
.promo-modern .promo-blob--gold { background: radial-gradient(circle at 50% 50%, rgba(220,186,120,0.5), transparent 68%); animation: promoFloat 22s ease-in-out infinite 2s; }
.promo-modern .promo-blob--olive { background: radial-gradient(circle at 50% 50%, rgba(124,140,82,0.4), transparent 70%); animation: promoFloat 26s ease-in-out infinite 1s; }

.promo-modern .promo-modern-hero { min-height: 100svh; }
.promo-modern .promo-modern-kicker { font-size: 1.65rem; line-height: 1.1; }
.promo-modern .promo-modern-title { font-size: 2.9rem; letter-spacing: 0; }
.promo-modern .promo-modern-date,
.promo-modern .promo-modern-listen-label { font-size: 0.72rem; line-height: 1.4; }
.promo-modern .promo-modern-cover { width: clamp(135px, 22svh, 185px); }

.promo-modern .promo-audio-glow::before {
    content: "";
    position: absolute;
    inset: -14px;
    border-radius: 38px;
    background: radial-gradient(60% 60% at 50% 40%, rgba(156,175,106,0.35), transparent 70%);
    filter: blur(18px);
    z-index: -1;
}

.promo-modern .promo-reveal { opacity: 0; transform: translateY(26px); transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1); }
.promo-modern .promo-reveal.is-visible { opacity: 1; transform: none; }

.promo-modern .promo-cover-hover { transition: transform 0.6s cubic-bezier(0.22,1,0.36,1); }
.promo-modern .promo-cover-hover:hover { transform: translateY(-8px); }

@media (min-width: 640px) {
    .promo-modern .promo-modern-kicker { font-size: 1.9rem; }
    .promo-modern .promo-modern-title { font-size: 4rem; }
    .promo-modern .promo-modern-date,
    .promo-modern .promo-modern-listen-label { font-size: 0.8rem; }
    .promo-modern .promo-modern-cover { width: clamp(150px, 24svh, 200px); }
}

@media (max-height: 780px) {
    .promo-modern .promo-modern-kicker { font-size: 1.55rem; }
    .promo-modern .promo-modern-title { font-size: 3.5rem; }
    .promo-modern .promo-modern-date { margin-top: 0.5rem; }
    .promo-modern .promo-modern-cover { width: clamp(135px, 22svh, 180px); }
}

@media (max-height: 700px) {
    .promo-modern .promo-modern-kicker { font-size: 1.35rem; }
    .promo-modern .promo-modern-title { font-size: 2.85rem; }
    .promo-modern .promo-modern-cover { width: clamp(120px, 20svh, 155px); }
}

@media (max-width: 420px) {
    .promo-modern .promo-modern-kicker { font-size: 1.45rem; }
    .promo-modern .promo-modern-title { font-size: 2.35rem; }
    .promo-modern .promo-modern-cover { width: clamp(130px, 22svh, 175px); }
}

@keyframes promoFloat {
    0%   { transform: translate3d(0, 0, 0) scale(1); }
    50%  { transform: translate3d(0, -28px, 0) scale(1.06); }
    100% { transform: translate3d(0, 0, 0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
    .promo-modern .promo-blob { animation: none !important; }
    .promo-modern .promo-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
    .promo-modern .promo-cover-hover { transition: none !important; }
    .promo-modern .promo-cover-hover:hover { transform: none !important; }
}
`;
