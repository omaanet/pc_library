'use client';

import * as React from 'react';
import { BookCollection } from './book-collection';
import { BookErrorBoundary } from './book-error-boundary';
import { Suspense } from 'react';
import { BookGridSkeleton } from '@/components/ui/loading-placeholder';

interface BookCollectionWrapperProps {
    displayPreviews: number; // -1: all, 0: non-preview only, 1: preview only
}

export function BookCollectionWrapper({ displayPreviews }: BookCollectionWrapperProps) {
    return (
        <BookErrorBoundary>
            <Suspense fallback={<BookGridSkeleton count={8} />}>
                <BookCollection displayPreviews={displayPreviews} />
            </Suspense>
        </BookErrorBoundary>
    );
}