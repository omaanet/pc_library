'use client';

/**
 * Client-side logging hook
 * Sends logs to /api/system/log without importing server-side DB client
 */
export function useLogger(source: string) {
  const logClientError = async (
    message: string,
    error?: unknown,
    additionalDetails?: Record<string, any>
  ) => {
    console.error(`[${source}] ${message}`, error, additionalDetails);
    const baseUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : '';
    await fetch(`${baseUrl}/api/system/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 'error', source, message, details: additionalDetails })
    });
  };

  const logClientWarning = async (
    message: string,
    details?: Record<string, any>
  ) => {
    console.warn(`[${source}] ${message}`, details);
    const baseUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : '';
    await fetch(`${baseUrl}/api/system/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 'warning', source, message, details })
    });
  };

  const logClientInfo = async (
    message: string,
    details?: Record<string, any>
  ) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[${source}] ${message}`, details);
    }
    const baseUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : '';
    await fetch(`${baseUrl}/api/system/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 'info', source, message, details })
    });
  };

  return { error: logClientError, warning: logClientWarning, info: logClientInfo };
}
