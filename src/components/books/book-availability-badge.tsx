import { BookOpenText, Headphones } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Book } from '@/types';
import { cn } from '@/lib/utils';
import { isAudioAvailable, isReadingAvailable } from '@/lib/book-visibility';

export interface BookAvailabilityBadgeProps {
    book: Book;
    audioIcon?: LucideIcon;
    readingIcon?: LucideIcon;
    iconSize?: number;
    iconColor?: string;
    className?: string;
}

export function BookAvailabilityBadge({
    book,
    audioIcon: AudioIcon = Headphones,
    readingIcon: ReadingIcon = BookOpenText,
    iconSize = 20,
    iconColor,
    className,
}: BookAvailabilityBadgeProps) {
    const hasAudio = isAudioAvailable(book);
    const hasReading = isReadingAvailable(book);

    if (!hasAudio && !hasReading) {
        return null;
    }

    const availabilityLabel = hasAudio && hasReading
        ? 'Audio e lettura disponibili'
        : hasAudio
            ? 'Audio disponibile'
            : 'Lettura disponibile';

    return (
        <div
            aria-label={availabilityLabel}
            role="img"
            className={cn(
                'absolute right-[var(--book-grid-audio-badge-right)] top-[var(--book-grid-audio-badge-top)] z-10',
                'flex flex-col items-center gap-1.5 rounded-tl-lg rounded-tr rounded-br-sm rounded-bl',
                'px-1.5 pt-3 pb-2.5 shadow-xl ring-1 ring-inset backdrop-blur-sm',
                'transition-[opacity,transform] duration-300 group-hover:scale-[var(--book-grid-badge-hover-scale)] motion-reduce:transition-none',
                'book-availability-badge-colors',
                className
            )}
        >
            {hasAudio && (
                <AudioIcon
                    aria-hidden="true"
                    color={iconColor}
                    size={iconSize}
                />
            )}
            {hasReading && (
                <ReadingIcon
                    aria-hidden="true"
                    color={iconColor}
                    size={iconSize}
                />
            )}
        </div>
    );
}
