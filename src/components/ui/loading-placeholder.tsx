/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/ui/loading-placeholder.tsx
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function BookCardSkeleton({ view }: { view: 'grid' | 'list' }) {
    if (view === 'grid') {
        return (
            <Card className="overflow-hidden">
                <div className="space-y-4">
                    <Skeleton className="aspect-[3/4] w-full" />
                    <div className="p-4 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex items-center justify-between pt-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-9 w-full" />
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="flex gap-4 p-4 border-b">
            {/* Cover Image Skeleton */}
            <Skeleton className="h-32 w-24 flex-shrink-0" />

            {/* Content Skeleton */}
            <div className="flex-1 space-y-3">
                <div className="flex justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                {/* Additional Info Skeleton */}
                <div className="flex gap-4 pt-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
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

export function BookDetailsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
            </div>

            {/* Content */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Cover Image */}
                <Skeleton className="w-full md:w-1/3 aspect-[3/4]" />

                {/* Details */}
                <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>

                    <Skeleton className="h-px w-full" />

                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>

                    <Skeleton className="h-px w-full" />

                    <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-9 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}