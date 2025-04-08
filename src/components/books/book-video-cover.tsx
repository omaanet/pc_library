'use client';

import * as React from 'react';
import { Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_COVER_SIZES } from '@/types/images';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book } from '@/types';

interface BookVideoCoverProps {
    videoSource: string;
    // book: Book;
    orientation: 'portrait' | 'landscape';
    className?: string;
}

export function BookVideoCover({ videoSource, orientation, className }: BookVideoCoverProps) {
    // Track video loading state
    const [videoLoaded, setVideoLoaded] = React.useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    // Get dimensions for list view
    const { width, height } = DEFAULT_COVER_SIZES.list;

    // Memoize the video source to prevent unnecessary re-renders
    // const videoSource = React.useMemo(() => {
    //     return book.coverImage;
    // }, [book.coverImage]);

    // Memoize the cover video component to prevent unnecessary re-renders
    const coverVideo = React.useMemo(() => (
        <div
            className="relative flex justify-center items-center bg-muted/30 rounded-sm"
            style={{ width, height }}
        >
            {/* Loading skeleton */}
            {/* {!videoLoaded && (
                <Skeleton className="absolute inset-0 rounded-sm" />
            )} */}

            {/* Book cover video */}
            <video
                ref={videoRef}
                src={videoSource}
                width={width}
                height={height}
                className={cn(
                    "max-w-full max-h-full rounded-sm object-contain transition-opacity duration-200",
                    videoLoaded ? "opacity-100" : "opacity-0"
                )}
                autoPlay={false}
                muted={false}
                loop={false}
                playsInline={false}
                onLoadedData={() => setVideoLoaded(true)}
                onError={() => setVideoLoaded(true)}
            />
        </div>
    ), [videoSource, videoLoaded, width, height]);

    // Title component
    const titleComponent = (
        <div className={cn(
            "text-sm font-medium line-clamp-2",
            orientation === 'landscape' ? "ml-3" : "mt-2 text-center"
        )}>
            anteprima
        </div>
    );

    return (
        <div
            className={cn(
                orientation === 'portrait'
                    ? "flex flex-col items-center"
                    : "flex flex-row items-center",
                className
            )}
        >
            {coverVideo}
            {titleComponent}
        </div>
    );
}
