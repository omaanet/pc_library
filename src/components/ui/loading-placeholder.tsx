// src/components/ui/loading-placeholder.tsx
import { cn } from '@/lib/utils';

interface LoadingPlaceholderProps {
    className?: string;
}

export function LoadingPlaceholder({ className }: LoadingPlaceholderProps) {
    return (
        <div className={cn('animate-pulse bg-muted rounded', className)} />
    );
}

export function BookCardSkeleton({ view }: { view: 'grid' | 'list' }) {
    if (view === 'grid') {
        return (
            <div className="space-y-4">
                <LoadingPlaceholder className="aspect-[3/4] w-full rounded-lg" />
                <div className="space-y-2">
                    <LoadingPlaceholder className="h-4 w-2/3" />
                    <LoadingPlaceholder className="h-3 w-full" />
                    <LoadingPlaceholder className="h-3 w-4/5" />
                    <LoadingPlaceholder className="h-8 w-full mt-4" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-4 p-4">
            <LoadingPlaceholder className="h-32 w-24 flex-shrink-0 rounded" />
            <div className="flex-1 space-y-2">
                <LoadingPlaceholder className="h-4 w-1/3" />
                <LoadingPlaceholder className="h-3 w-1/4" />
                <LoadingPlaceholder className="h-3 w-full" />
                <LoadingPlaceholder className="h-3 w-4/5" />
            </div>
            <LoadingPlaceholder className="h-8 w-24 self-start" />
        </div>
    );
}

export function BookGridSkeleton({ count = 10 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: count }).map((_, i) => (
                <BookCardSkeleton key={i} view="grid" />
            ))}
        </div>
    );
}

export function BookListSkeleton({ count = 10 }: { count?: number }) {
    return (
        <div className="divide-y rounded-lg border bg-card">
            {Array.from({ length: count }).map((_, i) => (
                <BookCardSkeleton key={i} view="list" />
            ))}
        </div>
    );
}