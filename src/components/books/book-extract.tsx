import React from 'react';

interface BookExtractProps {
    extract: string | undefined;
}

export function BookExtract({ extract }: BookExtractProps) {
    // Placeholder for now. Replace with actual logic to fetch/display book lines.
    return (
        <div>
            <h3 className="text-md sm:text-lg font-medium mb-3 text-cyan-400">Estratto</h3>
            <div className="bg-muted/40 rounded p-3 text-xs sm:text-sm whitespace-pre-line lh-1">
                {extract || 'Nessun estratto disponibile'}
            </div>
        </div>
    );
}
