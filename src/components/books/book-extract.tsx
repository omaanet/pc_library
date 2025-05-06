import React from 'react';

interface BookExtractProps {
    extract: string | undefined;
}

export function BookExtract({ extract }: BookExtractProps) {
    if (!extract) return null;

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-muted/40 rounded px-4 py-4">
            <h3 className="text-md sm:text-lg font-medium mb-3 text-cyan-400">Estratto</h3>
            {/* bg-b2lack/70 roun2ded-lg  */}
            <p className="py-0 ps-2 pe-3 indent-8 italic
                text-xs sm:text-[1.10rem]
                text-gray-700 dark:text-gray-300
                font-light
                text-justify whitespace-pre-line
                leading-relaxed
                line-clamp-4
                overflow-hidden text-ellipsis
                transition-colors duration-200">
                {extract || 'Nessun estratto disponibile'}
            </p>
        </div>
    );
}
