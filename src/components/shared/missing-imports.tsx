// src/components/shared/missing-imports.tsx
'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';

interface MissingImportProps {
    title?: string;
    description?: string;
    packageName: string;
    className?: string;
}

export function MissingImport({
    title = 'Missing Package',
    description = 'This component requires additional package installation.',
    packageName,
    className,
}: MissingImportProps) {
    return (
        <Alert variant="destructive" className={className}>
            <XCircle className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription className="mt-2">
                {description}
                <pre className="mt-2 rounded bg-secondary/50 px-[0.3rem] py-[0.2rem] font-mono text-sm">
                    npm install {packageName}
                </pre>
            </AlertDescription>
        </Alert>
    );
}

export function checkImport(packageName: string): boolean {
    try {
        require.resolve(packageName);
        return true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        return false;
    }
}