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
        <div className="flex-1 flex flex-col min-h-0 bg-muted/40 rounded px-4 py-4">
            <h3 className="text-md sm:text-lg font-medium mb-1 text-cyan-400">Estratto</h3>
            {/* bg-b2lack/70 roun2ded-lg  */}
            {/*
                WARNING: Rendering HTML from extract. Ensure extract is sanitized to prevent XSS vulnerabilities!
            */}
            {/* italic */}
            <p
                className="py-0 ps-2 pe-3 indent-8
                    text-[0.85rem] sm:text-[1.10rem]
                    text-gray-700 dark:text-gray-300
                    font-light
                    text-justify whitespace-pre-line
                    leading-default sm:leading-relaxed
                    line-clamp-5
                    overflow-hidden text-ellipsis"
                dangerouslySetInnerHTML={{ __html: sanitizedExtract || 'Nessun estratto disponibile' }}
            />
        </div>
    );
}
