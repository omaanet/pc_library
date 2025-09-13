'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Book } from '@/types';
import { BookCover } from '@/components/books/book-cover';
import { DEFAULT_COVER_SIZES } from '@/types/images';

export interface PreviewCoverProps {
    mounted: boolean;
    book: Book;
    index: number;
    itemsVerticalAlign?: string;
}

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), {
    ssr: false,
});

export function PreviewCover({ mounted, book, itemsVerticalAlign = 'items-start' }: PreviewCoverProps) {
    const hasMedia = Boolean(book.mediaId && String(book.mediaId).trim().length > 0);
    const placement = (book.previewPlacement || 'right').toLowerCase();

    const player = (
        <div
            className="relative flex justify-center items-center bg-muted/30 rounded-sm"
            style={{ height: DEFAULT_COVER_SIZES.video.height }}
        >
            {mounted && hasMedia && (
                <MuxPlayer
                    playbackId={book.mediaId as string}
                    metadata={{
                        video_title: book.mediaTitle || book.title,
                        viewer_user_id: book.mediaUid || undefined,
                    }}
                    style={(() => {
                        const s: React.CSSProperties & Record<string, string | number> = {
                            width: DEFAULT_COVER_SIZES.video.width,
                            height: DEFAULT_COVER_SIZES.video.height,
                        };
                        s['--cast-button'] = 'none';
                        return s;
                    })()}
                />
            )}
        </div>
    );

    if (!hasMedia) {
        return <BookCover book={book} orientation="portrait" />;
    }


    if (placement === 'left') {
        return (
            <div className={`flex flex-row ${itemsVerticalAlign} gap-4`}>
                {player}
                <BookCover book={book} orientation="portrait" />
            </div>
        );
    }

    // Default and explicit 'right'
    return (
        <div className={`flex flex-row ${itemsVerticalAlign} gap-4`}>
            <BookCover book={book} orientation="portrait" />
            {player}
        </div>
    );
}
