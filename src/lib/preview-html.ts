import DOMPurify from 'isomorphic-dompurify';

// isomorphic-dompurify provides a jsdom-backed server instance and a browser
// export. The identical allowlist is applied at validation and every injection.
export function sanitizePreviewHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'hr'],
        ALLOWED_ATTR: ['href', 'title'],
        ALLOW_DATA_ATTR: false,
        ALLOW_ARIA_ATTR: false,
    });
}

export function hasPreviewText(html: string): boolean {
    return DOMPurify.sanitize(sanitizePreviewHtml(html), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
        .replace(/&(?:nbsp|#160|#x0*a0);/gi, ' ').replace(/[\s\u200B-\u200D\uFEFF]/g, '').length > 0;
}
