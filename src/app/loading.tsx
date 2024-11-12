// src/app/loading.tsx
import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="container flex min-h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
}