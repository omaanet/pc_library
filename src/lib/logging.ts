// src/lib/logging.ts
import { getNeonClient } from './db';

export type LogLevel = 'error' | 'warning' | 'info';

export interface LogEntry {
    level: LogLevel;
    source: string;
    message: string;
    details?: Record<string, any>;
    userId?: string;
    ipAddress?: string;
    requestPath?: string;
    stackTrace?: string;
}

/**
 * Logger service for centralized application logging
 * Saves logs to the database and provides utilities for structured logging
 */
export class Logger {
    /**
     * Log an error to the database
     * @param source The source of the error (component, function, module)
     * @param message A concise error message
     * @param details Optional details object (will be stored as JSON)
     * @param options Additional logging options (userId, stackTrace, etc)
     */
    static async error(
        source: string,
        message: string,
        details?: Record<string, any>,
        options?: Partial<Omit<LogEntry, 'level' | 'source' | 'message' | 'details'>>
    ): Promise<void> {
        return this.log('error', source, message, details, options);
    }

    /**
     * Log a warning to the database
     * @param source The source of the warning
     * @param message A concise warning message
     * @param details Optional details object (will be stored as JSON)
     * @param options Additional logging options
     */
    static async warning(
        source: string,
        message: string,
        details?: Record<string, any>,
        options?: Partial<Omit<LogEntry, 'level' | 'source' | 'message' | 'details'>>
    ): Promise<void> {
        return this.log('warning', source, message, details, options);
    }

    /**
     * Log informational message to the database
     * @param source The source of the info
     * @param message A concise info message
     * @param details Optional details object (will be stored as JSON)
     * @param options Additional logging options
     */
    static async info(
        source: string,
        message: string,
        details?: Record<string, any>,
        options?: Partial<Omit<LogEntry, 'level' | 'source' | 'message' | 'details'>>
    ): Promise<void> {
        return this.log('info', source, message, details, options);
    }

    /**
     * Internal method to log messages to the database
     */
    private static async log(
        level: LogLevel,
        source: string,
        message: string,
        details?: Record<string, any>,
        options?: Partial<Omit<LogEntry, 'level' | 'source' | 'message' | 'details'>>
    ): Promise<void> {
        try {
            const client = getNeonClient();

            // Also log to console in development for debugging
            if (process.env.NODE_ENV !== 'production') {
                console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'info'](
                    `[${level.toUpperCase()}][${source}] ${message}`,
                    details || '',
                    options || ''
                );
            }

            // Prepare the details as JSON
            const detailsJson = details ? JSON.stringify(details) : null;

            // Insert the log entry into the database
            await client.query(`INSERT INTO system_logs (level, source, message, details, user_id, ip_address, request_path, stack_trace) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    level,
                    source,
                    message,
                    detailsJson,
                    options?.userId || null,
                    options?.ipAddress || null,
                    options?.requestPath || null,
                    options?.stackTrace || null
                ]
            );
        } catch (err) {
            // Fallback to console logging if database logging fails
            // This prevents logging failures from breaking application flow
            console.error('[Logger] Failed to write log to database:', err);
            console.error(`[${level.toUpperCase()}][${source}] ${message}`, details || '');
        }
    }

    /**
     * Helper to extract useful error information
     * @param error The error object to extract information from
     */
    static extractErrorDetails(error: unknown): Record<string, any> {
        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack,
                ...(error as any).cause ? { cause: (error as any).cause } : {},
            };
        }

        return { raw: String(error) };
    }

    /**
     * Helper to capture HTTP request context for logs
     * @param req Next.js or Express request object 
     */
    static extractRequestContext(req: any): Pick<LogEntry, 'ipAddress' | 'requestPath'> {
        try {
            return {
                ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
                requestPath: req.url || req.path
            };
        } catch (e) {
            return {};
        }
    }
}

/**
 * React hook to log client-side errors
 * Can be used in any component that needs to log errors
 */
export function useLogger(source: string) {
    const logClientError = async (
        message: string,
        error?: unknown,
        additionalDetails?: Record<string, any>
    ) => {
        console.error(`[${source}] ${message}`, error);

        // Combine error details with additional details
        const details = {
            ...(error ? Logger.extractErrorDetails(error) : {}),
            ...(additionalDetails || {})
        };

        try {
            // Get the base URL for the API endpoint (window.location gives us the current host)
            const baseUrl = typeof window !== 'undefined'
                ? `${window.location.protocol}//${window.location.host}`
                : '';

            // Log to server with absolute URL
            await fetch(`${baseUrl}/api/system/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level: 'error',
                    source,
                    message,
                    details
                })
            });
        } catch (e) {
            // Fallback to console if API call fails
            console.error('[useLogger] Failed to send log to server:', e);
        }
    };

    const logClientWarning = async (
        message: string,
        details?: Record<string, any>
    ) => {
        console.warn(`[${source}] ${message}`, details);

        try {
            // Get the base URL for the API endpoint
            const baseUrl = typeof window !== 'undefined'
                ? `${window.location.protocol}//${window.location.host}`
                : '';

            await fetch(`${baseUrl}/api/system/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level: 'warning',
                    source,
                    message,
                    details
                })
            });
        } catch (e) {
            console.error('[useLogger] Failed to send warning to server:', e);
        }
    };

    const logClientInfo = async (
        message: string,
        details?: Record<string, any>
    ) => {
        if (process.env.NODE_ENV !== 'production') {
            console.info(`[${source}] ${message}`, details);
        }

        try {
            // Get the base URL for the API endpoint
            const baseUrl = typeof window !== 'undefined'
                ? `${window.location.protocol}//${window.location.host}`
                : '';

            await fetch(`${baseUrl}/api/system/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level: 'info',
                    source,
                    message,
                    details
                })
            });
        } catch (e) {
            console.error('[useLogger] Failed to send info to server:', e);
        }
    };

    return {
        error: logClientError,
        warning: logClientWarning,
        info: logClientInfo
    };
}
