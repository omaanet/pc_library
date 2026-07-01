const WASABI_S3_ORIGIN = 'https://s3.eu-south-1.wasabisys.com';
const VERCEL_ANALYTICS_SCRIPT_ORIGIN = 'https://va.vercel-scripts.com';

export const APP_CSP_DIRECTIVES = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${VERCEL_ANALYTICS_SCRIPT_ORIGIN}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: ${WASABI_S3_ORIGIN}`,
    "font-src 'self' data:",
    `connect-src 'self' ${WASABI_S3_ORIGIN}`,
    `media-src 'self' ${WASABI_S3_ORIGIN}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
];

export const APP_CONTENT_SECURITY_POLICY = APP_CSP_DIRECTIVES.join('; ');
