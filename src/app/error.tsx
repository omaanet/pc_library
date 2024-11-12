// src/app/error.tsx
'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="container flex min-h-[400px] items-center justify-center">
            <Alert variant="destructive" className="max-w-[500px]">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Something went wrong!</AlertTitle>
                <AlertDescription className="mt-2 flex flex-col gap-3">
                    <p>{error.message || 'An error occurred while loading this page.'}</p>
                    <Button
                        variant="outline"
                        onClick={() => reset()}
                        className="w-fit"
                    >
                        Try again
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    );
}
