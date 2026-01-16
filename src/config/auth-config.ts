// src/config/auth-config.ts
/**
 * Configuration constants for the authentication system
 * 
 * The system uses passwordless authentication with email-only access.
 * Users are immediately activated upon registration.
 */

// Session durations
export const SESSION_DURATION = {
  AUTH: 3 * 60 * 60, // 3 hours in seconds
};
