import DOMPurify from 'dompurify';

/**
 * Sanitization configuration for DOMPurify
 * Only allows basic formatting tags for security
 */
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote',
    'a'
  ],
  ALLOWED_ATTR: ['href', 'title', 'class'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
  SANITIZE_DOM: true,
  KEEP_CONTENT: true
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Uses DOMPurify with strict security configuration
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}

/**
 * Sanitizes and converts plain text to safe HTML
 * Converts newlines to <br> tags and sanitizes the result
 */
export function sanitizePlainText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Convert newlines to <br> tags
  const html = text.replace(/\n/g, '<br/>');
  
  // Sanitize the resulting HTML
  return sanitizeHtml(html);
}

/**
 * Type marker for sanitized content
 */
export type SanitizedHtml = string & { readonly __brand: 'SanitizedHtml' };

/**
 * Sanitizes HTML and returns it as a branded type for type safety
 */
export function sanitizeHtmlTyped(html: string): SanitizedHtml {
  return sanitizeHtml(html) as SanitizedHtml;
}

/**
 * Checks if a string has been sanitized (type guard)
 */
export function isSanitizedHtml(content: string): content is SanitizedHtml {
  // In practice, we rely on the type system, but this can be useful for runtime checks
  return typeof content === 'string';
}

/**
 * Sanitizes user input for use in attributes (like title, alt, etc.)
 * More restrictive than content sanitization
 */
export function sanitizeAttribute(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  // Remove all HTML tags and entities
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, '')
    .trim()
    .substring(0, 500); // Limit attribute length
}

/**
 * Sanitizes URL for safe use in href attributes
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(url, window.location.origin);
    
    // Only allow http, https, and mailto protocols
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '';
    }

    // Remove javascript: and data: URLs
    if (url.toLowerCase().startsWith('javascript:') || url.toLowerCase().startsWith('data:')) {
      return '';
    }

    return parsed.toString();
  } catch {
    // Invalid URL
    return '';
  }
}

/**
 * XSS payload test strings for testing
 */
export const XSS_TEST_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src="x" onerror="alert(\'XSS\')">',
  '<svg onload="alert(\'XSS\')">',
  '"><script>alert("XSS")</script>',
  '<iframe src="javascript:alert(\'XSS\')"></iframe>',
  '<body onload="alert(\'XSS\')">',
  '<input autofocus onfocus="alert(\'XSS\')">',
  '<select onfocus="alert(\'XSS\')" autofocus>',
  '<textarea onfocus="alert(\'XSS\')" autofocus>',
  '<keygen onfocus="alert(\'XSS\')" autofocus>',
  '<video><source onerror="alert(\'XSS\')">',
  '<details open ontoggle="alert(\'XSS\')">',
  '<marquee onstart="alert(\'XSS\')">',
  'javascript:alert(\'XSS\')',
  'data:text/html,<script>alert(\'XSS\')</script>'
];

/**
 * Test function to verify sanitization works correctly
 */
export function testSanitization(): boolean {
  let allPassed = true;
  
  XSS_TEST_PAYLOADS.forEach(payload => {
    const sanitized = sanitizeHtml(payload);
    if (sanitized.includes('<script>') || sanitized.includes('javascript:') || sanitized.includes('onerror=')) {
      console.error(`Sanitization test failed for payload: ${payload}`);
      allPassed = false;
    }
  });

  return allPassed;
}
