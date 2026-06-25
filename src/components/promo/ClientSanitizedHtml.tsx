'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { sanitizeHtml } from '@/lib/sanitization';

type SanitizedHtmlElement = 'div' | 'blockquote';

interface ClientSanitizedHtmlProps {
    html: string;
    as?: SanitizedHtmlElement;
    className?: string;
    style?: CSSProperties;
}

export function ClientSanitizedHtml({
    html,
    as: Element = 'div',
    className,
    style,
}: ClientSanitizedHtmlProps) {
    const [sanitizedHtml, setSanitizedHtml] = useState('');

    useEffect(() => {
        setSanitizedHtml(html ? sanitizeHtml(html) : '');
    }, [html]);

    if (!sanitizedHtml) return null;

    return (
        <Element
            className={className}
            style={style}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
}
