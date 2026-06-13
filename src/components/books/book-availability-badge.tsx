import { BookOpenText, Headphones } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Book } from '@/types';
import { cn } from '@/lib/utils';
import { isAudioAvailable, isReadingAvailable } from '@/lib/book-visibility';

export type BookAvailabilityBadgePalette =
    | 'gold'
    | 'ocean'
    | 'lagoon'
    | 'lavender'
    | 'coral'
    | 'paper';

const PALETTE_CLASSES = {
    gold: [
        'bg-amber-200/95 text-amber-950 ring-amber-400/70 shadow-amber-950/30',
        'dark:bg-amber-700/95 dark:text-amber-50 dark:ring-amber-400/60 dark:shadow-amber-950/50',
    ],
    ocean: [
        'bg-sky-200/95 text-sky-950 ring-sky-400/70 shadow-sky-950/30',
        'dark:bg-sky-800/95 dark:text-sky-50 dark:ring-sky-400/60 dark:shadow-sky-950/50',
    ],
    lagoon: [
        'bg-teal-200/95 text-teal-950 ring-teal-400/70 shadow-teal-950/30',
        'dark:bg-teal-800/95 dark:text-teal-50 dark:ring-teal-400/60 dark:shadow-teal-950/50',
    ],
    lavender: [
        'bg-violet-200/95 text-violet-950 ring-violet-400/70 shadow-violet-950/30',
        'dark:bg-violet-800/95 dark:text-violet-50 dark:ring-violet-400/60 dark:shadow-violet-950/50',
    ],
    coral: [
        'bg-rose-200/95 text-rose-950 ring-rose-400/70 shadow-rose-950/30',
        'dark:bg-rose-800/95 dark:text-rose-50 dark:ring-rose-400/60 dark:shadow-rose-950/50',
    ],
    paper: [
        'bg-stone-200/95 text-stone-950 ring-stone-400/70 shadow-stone-950/30',
        'dark:bg-stone-700/95 dark:text-stone-50 dark:ring-stone-400/60 dark:shadow-stone-950/50',
    ],
} satisfies Record<BookAvailabilityBadgePalette, readonly string[]>;

export interface BookAvailabilityBadgeProps {
    book: Book;
    audioIcon?: LucideIcon;
    readingIcon?: LucideIcon;
    iconSize?: number;
    iconColor?: string;
    palette?: BookAvailabilityBadgePalette;
    className?: string;
}

export function BookAvailabilityBadge({
    book,
    audioIcon: AudioIcon = Headphones,
    readingIcon: ReadingIcon = BookOpenText,
    iconSize = 20,
    iconColor,
    palette = 'gold',
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
                PALETTE_CLASSES[palette],
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
