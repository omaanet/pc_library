// src/components/books/book-collection-wrapper.tsx
'use client';

import * as React from 'react';
import { BookCollection } from './book-collection';
import { BookErrorBoundary } from './book-error-boundary';
import { Suspense } from 'react';
import { BookGridSkeleton } from '@/components/ui/loading-placeholder';

export function BookCollectionWrapper() {
    return (
        <BookErrorBoundary>
            <Suspense fallback={<BookGridSkeleton count={8} />}>
                <BookCollection />
            </Suspense>
        </BookErrorBoundary>
    );
}