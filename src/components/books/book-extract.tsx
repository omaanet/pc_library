import React from 'react';
import DOMPurify from 'dompurify';

interface BookExtractProps {
    extract: string | undefined;
}

export function BookExtract({ extract }: BookExtractProps) {
    if (!extract) return null;

    extract = extract.replace(/\r/g, "");
    extract = extract.replace(/\n/g, "<br/>");
    const sanitizedExtract = DOMPurify.sanitize(extract);

    return (
        <div className="flex flex-col bg-muted/40 rounded px-2 sm:px-4 py-2 sm:py-4">
            <h3 className="text-sm sm:text-md md:text-lg font-medium mb-1 text-cyan-400">Estratto</h3>
            {/* bg-b2lack/70 roun2ded-lg  */}
            {/*
                WARNING: Rendering HTML from extract. Ensure extract is sanitized to prevent XSS vulnerabilities!
            */}
            {/* italic */}
            <p
                className="py-0 ps-1 sm:ps-2 pe-2 sm:pe-3 indent-4 sm:indent-8
                    text-[0.75rem] sm:text-[0.85rem] md:text-[1.10rem]
                    text-gray-700 dark:text-gray-300
                    font-light
                    text-justify whitespace-pre-line
                    leading-tight sm:leading-default md:leading-relaxed
                    line-clamp-4 sm:line-clamp-5
                    overflow-hidden text-ellipsis"
                dangerouslySetInnerHTML={{ __html: sanitizedExtract || 'Nessun estratto disponibile' }}
            />
        </div>
    );
}
