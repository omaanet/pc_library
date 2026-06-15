'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { PromoAudioPlayer } from '@/components/promo/PromoAudioPlayer';
import { getCoverImageUrl } from '@/lib/image-utils';
import { displayFontClass } from '@/config/fonts';
import type { Book, PromoPage } from '@/types';

interface PromoPageViewProps {
    promoPage: PromoPage;
    book: Book;
}

function formatPublishingDate(value: string | undefined): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('it-IT', { year: 'numeric', month: 'long' }).format(date);
}

export function PromoPageView({ promoPage, book }: PromoPageViewProps) {
    const coverUrl = useMemo(
        () => getCoverImageUrl(book.coverImage, 'detail', { bookId: book.id }),
        [book.coverImage, book.id]
    );

    const description = book.extract || book.summary || null;
    const publishedLabel = formatPublishingDate(book.publishingDate);

    return (
        <main className="relative min-h-screen w-full overflow-hidden bg-[#faf5ec] text-[#3a2e27]">
            {/* Soft warm ambient glow */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(1200px 600px at 15% 0%, rgba(214,158,108,0.22), transparent 60%), radial-gradient(900px 500px at 100% 100%, rgba(176,120,84,0.18), transparent 55%)',
                }}
            />

            <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 sm:px-10 lg:py-24">
                <div className="mb-10 text-center lg:mb-14">
                    <p className={`${displayFontClass} text-2xl text-[#b6743f] sm:text-3xl`}>
                        Anteprima audio
                    </p>
                    <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight tracking-tight text-[#33271f] sm:text-5xl lg:text-6xl">
                        {book.title}
                    </h1>
                    {publishedLabel && (
                        <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[#9a8472]">
                            {publishedLabel}
                        </p>
                    )}
                </div>

                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    {/* Book cover */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="relative w-[230px] sm:w-[280px] lg:w-[330px]">
                            <div
                                aria-hidden
                                className="absolute -inset-4 rounded-2xl bg-[#c98f5f]/25 blur-2xl"
                            />
                            <div className="relative overflow-hidden rounded-lg px-3 shadow-[0_30px_60px_-20px_rgba(78,52,33,0.55)] ring-1 ring-black/5">
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

                    {/* "Tablet" element hosting the audio player */}
                    <div className="flex justify-center lg:justify-start">
                        <div className="w-full max-w-md">
                            <div className="rounded-[26px] bg-gradient-to-b from-[#2c2620] to-[#1d1813] p-3 shadow-[0_30px_60px_-25px_rgba(40,26,16,0.7)] ring-1 ring-black/20 sm:p-4">
                                <div className="rounded-[16px] bg-[#16120e] p-5 ring-1 ring-white/5 sm:p-6">
                                    <p className="mb-4 text-center text-xs uppercase tracking-[0.25em] text-[#c79a6f]">
                                        Ascolta l&apos;anteprima
                                    </p>
                                    <PromoAudioPlayer
                                        promoPage={promoPage}
                                        book={book}
                                        unavailableClassName="py-6 text-center text-sm text-[#9a8472]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {description && (
                    <div className="mx-auto mt-12 max-w-2xl text-center lg:mt-16">
                        <p className="text-base leading-relaxed text-[#5c4a3d] sm:text-lg">
                            {description}
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
