import React from 'react';

interface BookExtractProps {
    bookId: string;
    // Add more props as needed, e.g., bookTitle, etc.
}

export function BookExtract({ bookId }: BookExtractProps) {
    // Placeholder for now. Replace with actual logic to fetch/display book lines.
    return (
        <div>
            <h3 className="text-md sm:text-lg font-medium mb-3 text-cyan-400">Estratto</h3>
            <div className="bg-muted/40 rounded p-3 text-xs sm:text-sm whitespace-pre-line">
                Lore ipsum dixit...

                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                Ut enim ad minim veniam.
                Quis nostrud exercitation ullamco.
            </div>
        </div>
    );
}
