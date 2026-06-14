import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface GuideMarker {
    number: number;
    text: string;
}

interface GuideFigureProps {
    src: string;
    alt: string;
    caption: string;
    width: number;
    height: number;
    markers: GuideMarker[];
    className?: string;
}

export function GuideFigure({
    src,
    alt,
    caption,
    width,
    height,
    markers,
    className,
}: GuideFigureProps) {
    return (
        <figure
            className={cn(
                'overflow-hidden rounded-2xl border bg-card shadow-sm',
                className
            )}
        >
            <div className="relative bg-muted/40">
                <Image
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    className="h-auto w-full"
                    sizes="(max-width: 1024px) 100vw, 850px"
                />
            </div>

            <figcaption className="space-y-4 p-5 sm:p-6">
                <p className="text-base font-semibold leading-7 text-foreground">
                    {caption}
                </p>
                <ol className="grid gap-3 sm:grid-cols-2">
                    {markers.map((marker) => (
                        <li
                            key={marker.number}
                            className="flex items-start gap-3 text-base leading-7 text-muted-foreground"
                        >
                            <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-sky-700 text-sm font-bold text-white">
                                {marker.number}
                            </span>
                            <span>{marker.text}</span>
                        </li>
                    ))}
                </ol>
            </figcaption>
        </figure>
    );
}
