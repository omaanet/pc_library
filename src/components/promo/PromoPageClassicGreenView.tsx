'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { PromoAudioPlayer } from '@/components/promo/PromoAudioPlayer';
import { getCoverImageUrl } from '@/lib/image-utils';
import { displayFontClass } from '@/config/fonts';
import type { Book, PromoPage } from '@/types';

interface PromoPageClassicGreenViewProps {
    promoPage: PromoPage;
    book: Book;
}

function formatPublishingDate(value: string | undefined): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('it-IT', { year: 'numeric', month: 'long' }).format(date);
}

/**
 * "Classica - Green" template: the same single-screen hero layout as the classic
 * template, recolored with the green / yellow-green glassmorphic palette from
 * the omaa.it reference (deep teal-green background, cream paper text, gold and
 * leaf accents, a frosted paper frame around the cover, and a frosted dark-green
 * glass panel hosting the audio player so its light text stays legible).
 */
export function PromoPageClassicGreenView({ promoPage, book }: PromoPageClassicGreenViewProps) {
    const coverUrl = useMemo(
        () => getCoverImageUrl(book.coverImage, 'detail', { bookId: book.id }),
        [book.coverImage, book.id]
    );

    const description = book.extract || book.summary || null;
    const publishedLabel = formatPublishingDate(book.publishingDate);

    return (
        <main
            className="relative min-h-screen w-full overflow-hidden text-[#fff8e8]"
            style={{ background: 'linear-gradient(145deg, #081916, #12342e 58%, #10231f)' }}
        >
            {/* Leaf / gold / coral ambient glows over the deep-green base */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(circle at 10% 15%, rgba(167,217,119,0.38), transparent 26rem), radial-gradient(circle at 86% 8%, rgba(239,200,102,0.30), transparent 24rem), radial-gradient(circle at 72% 84%, rgba(242,140,111,0.22), transparent 28rem)',
                }}
            />

            <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 sm:px-10 lg:py-24">
                <div className="mb-10 text-center lg:mb-14">
                    <p className={`${displayFontClass} text-2xl text-[#efc866] sm:text-3xl`}>
                        Anteprima audio
                    </p>
                    <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight tracking-tight text-[#fff8e8] sm:text-5xl lg:text-6xl">
                        {book.title}
                    </h1>
                    {publishedLabel && (
                        <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[#9bb3aa]">
                            {publishedLabel}
                        </p>
                    )}
                </div>

                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    {/* Book cover wrapped in a frosted paper glass frame */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="relative w-[230px] sm:w-[280px] lg:w-[330px]">
                            <div
                                aria-hidden
                                className="absolute -inset-5 rounded-3xl blur-2xl"
                                style={{
                                    background:
                                        'radial-gradient(circle at 50% 50%, rgba(167,217,119,0.45), rgba(239,200,102,0.25) 60%, transparent 75%)',
                                }}
                            />
                            <div
                                className="relative rounded-[20px] px-4 py-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)] ring-1 ring-white/30 backdrop-blur-md"
                                style={{
                                    background:
                                        'linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,248,232,0.96))',
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

                    {/* Frosted-glass panel hosting the audio player */}
                    <div className="flex justify-center lg:justify-start">
                        <div className="w-full max-w-md">
                            <div className="rounded-[26px] border border-white/10 bg-white/[0.07] p-3 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-4">
                                <div
                                    className="rounded-[16px] p-5 ring-1 ring-white/10 backdrop-blur-md sm:p-6"
                                    style={{ background: 'rgba(8,25,22,0.62)' }}
                                >
                                    <p className="mb-4 text-center text-xs uppercase tracking-[0.25em] text-[#efc866]">
                                        Ascolta l&apos;anteprima
                                    </p>
                                    <PromoAudioPlayer
                                        promoPage={promoPage}
                                        book={book}
                                        unavailableClassName="py-6 text-center text-sm text-[#9bb3aa]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {description && (
                    <div className="mx-auto mt-12 max-w-2xl text-center lg:mt-16">
                        <p
                            className="text-base leading-relaxed sm:text-lg"
                            style={{ color: 'rgba(255,248,232,0.85)' }}
                        >
                            {description}
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
