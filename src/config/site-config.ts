// src/config/site-config.ts
/**
 * General site configuration constants.
 * Centralizes site-wide settings like contact information to avoid duplication.
 */

// Contact email address - configurable based on environment for development vs production
export const SITE_CONFIG = {
  CONTACT_EMAIL: process.env.NODE_ENV === 'development' ? 'oscar@omaa.it' : 'info@raccontiinvoceecaratteri.it',
} as const;
