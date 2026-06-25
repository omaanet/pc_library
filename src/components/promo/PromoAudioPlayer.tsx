'use client';

import { useCallback, useMemo, useRef } from 'react';
import HTML5Player from '@/components/audio/HTML5Player';
import type { Track } from '@/components/audio/types';
import { SITE_CONFIG } from '@/config/site-config';
import { ClientSanitizedHtml } from '@/components/promo/ClientSanitizedHtml';
import { DEFAULT_PROMO_AUDIO_TYPE } from '@/lib/promo-page-input';
import type { Book, PromoPage } from '@/types';

interface PromoAudioPlayerProps {
    promoPage: PromoPage;
    book: Book;
    unavailableClassName: string;
}

export function PromoAudioPlayer({ promoPage, book, unavailableClassName }: PromoAudioPlayerProps) {
    const hasTrackedPlay = useRef(false);
    const tracks: Track[] = useMemo(() => {
        if (!promoPage.mediaId) return [];
        return [
            {
                title: book.title,
                url: `${SITE_CONFIG.PROMO_AUDIO_CDN}/${promoPage.mediaId}`,
                kind: 'main',
            },
        ];
    }, [promoPage.mediaId, book.title]);

    const handleFirstPlay = useCallback(() => {
        if (!promoPage.mediaId || hasTrackedPlay.current) return;
        hasTrackedPlay.current = true;

        void fetch('/api/statistics/promo-audio-play', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                promoPageId: promoPage.id,
                slug: promoPage.slug,
                bookId: book.id,
                mediaId: promoPage.mediaId,
            }),
        }).catch((error) => {
            console.error('Failed to track promo audio play:', error);
        });
    }, [book.id, promoPage.id, promoPage.mediaId, promoPage.slug]);

    if (tracks.length === 0) {
        return (
            <div className={unavailableClassName}>
                <ClientSanitizedHtml
                    html={promoPage.audioType?.trim() || DEFAULT_PROMO_AUDIO_TYPE}
                    className="inline [&_p]:m-0 [&_p]:inline"
                />{' '}
                <span>audio non disponibile.</span>
            </div>
        );
    }

    return <HTML5Player tracks={tracks} onFirstPlay={handleFirstPlay} />;
}
