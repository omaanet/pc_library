// src/config/auth-config.ts
/**
 * Configuration constants for the authentication system
 * 
 * USE_NEW_AUTH_FLOW: When true, uses the simplified authentication flow without:
 * - Email verification
 * - Password generation
 * - Account activation process
 * 
 * When false, uses the standard authentication flow with email verification and account activation.
 */

// Making the constant more "dynamic" to force re-evaluation
export const USE_NEW_AUTH_FLOW = process.env.NODE_ENV === 'production' ? true : true; // Set to true to use the new auth flow by default

// Session durations
export const SESSION_DURATION = {
  OLD_AUTH: 7 * 24 * 60 * 60, // 7 days in seconds
  NEW_AUTH: 3 * 60 * 60, // 3 hours in seconds
};
