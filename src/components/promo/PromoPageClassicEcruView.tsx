'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { ClientSanitizedHtml } from '@/components/promo/ClientSanitizedHtml';
import { PromoAudioTypeLabel } from '@/components/promo/PromoAudioTypeLabel';
import { PromoAudioPlayer } from '@/components/promo/PromoAudioPlayer';
import { PromoHomeLink } from '@/components/promo/PromoHomeLink';
import { getCoverImageUrl } from '@/lib/image-utils';
import { displayFontClass } from '@/config/fonts';
import type { Book, PromoPage } from '@/types';

interface PromoPageClassicEcruViewProps {
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
 * "Classica - Ecru" template: a dark ink/navy classic layout with lime and
 * warm accents, designed to keep bright cover art visually separated.
 */
export function PromoPageClassicEcruView({ promoPage, book, disableTracking = false }: PromoPageClassicEcruViewProps) {
    const coverUrl = useMemo(
        () => getCoverImageUrl(book.coverImage, 'detail', { bookId: book.id }),
        [book.coverImage, book.id]
    );

    const description = book.extract || book.summary || null;
    const publishedLabel = formatPublishingDate(promoPage.publishingDateOverride ?? book.publishingDate);

    return (
        <main
            className="relative min-h-screen w-full overflow-hidden text-[#fff8e8]"
            style={{ background: 'linear-gradient(145deg, #020546 0%, #101735 56%, #242016 100%)' }}
        >
            <PromoHomeLink className="text-[#f6ffd4] backdrop-blur-md hover:bg-[#020546]/60" />

            {/* Lime, orange, and taupe glows reference the cover without matching its field color. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(circle at 12% 16%, rgba(217,255,149,0.18), transparent 22rem), radial-gradient(circle at 84% 12%, rgba(255,156,76,0.20), transparent 24rem), radial-gradient(circle at 72% 84%, rgba(96,90,72,0.28), transparent 28rem)',
                }}
            />

            <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 sm:px-10 lg:py-24">
                <div className="mb-10 text-center lg:mb-14">
                    <PromoAudioTypeLabel
                        audioType={promoPage.audioType}
                        variant="title"
                        className={`${displayFontClass} text-2xl text-[#d9ff95] sm:text-3xl`}
                    />
                    <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight tracking-tight text-[#fff8e8] sm:text-5xl lg:text-6xl">
                        {book.title}
                    </h1>
                    {publishedLabel && (
                        <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[#c2bca6]">
                            {publishedLabel}
                        </p>
                    )}
                </div>

                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    {/* Pale frame separates bright cover art from the dark page. */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="relative w-[230px] sm:w-[280px] lg:w-[330px]">
                            <div
                                aria-hidden
                                className="absolute -inset-5 rounded-3xl blur-2xl"
                                style={{
                                    background:
                                        'radial-gradient(circle at 50% 50%, rgba(217,255,149,0.30), rgba(255,156,76,0.18) 58%, transparent 76%)',
                                }}
                            />
                            <div
                                className="relative rounded-[20px] px-4 py-2 shadow-[0_34px_70px_-22px_rgba(0,0,0,0.72)] ring-1 ring-[#d9ff95]/45 backdrop-blur-md"
                                style={{
                                    background:
                                        'linear-gradient(135deg, rgba(255,255,245,0.92), rgba(246,255,212,0.98))',
                                }}
                            >
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

                    {/* Dark navy glass panel preserves audio-player contrast. */}
                    <div className="flex justify-center lg:justify-start">
                        <div className="w-full max-w-md">
                            <div className="rounded-[26px] border border-[#d9ff95]/18 bg-white/[0.06] p-3 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-4">
                                <div
                                    className="rounded-[16px] p-5 ring-1 ring-[#d9ff95]/15 backdrop-blur-md sm:p-6"
                                    style={{ background: 'rgba(2,5,70,0.72)' }}
                                >
                                    <PromoAudioTypeLabel
                                        audioType={promoPage.audioType}
                                        variant="listen"
                                        className="mb-4 text-center text-xs uppercase tracking-[0.25em] text-[#d9ff95]"
                                    />
                                    <PromoAudioPlayer
                                        promoPage={promoPage}
                                        book={book}
                                        unavailableClassName="py-6 text-center text-sm text-[#c2bca6]"
                                        disableTracking={disableTracking}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {description && (
                    <div className="mx-auto mt-12 max-w-2xl text-center lg:mt-16">
                        <ClientSanitizedHtml
                            html={description}
                            className="text-base leading-relaxed sm:text-lg [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[#d9ff95]/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-left [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-left"
                            style={{ color: 'rgba(255,248,232,0.86)' }}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}
