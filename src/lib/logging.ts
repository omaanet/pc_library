// src/lib/logging.ts
// Use dynamic import for db to avoid client-side import issues
let getNeonClient: () => any;

// Only import database module on the server side
if (typeof window === 'undefined') {
    // We're on the server
    import('./db').then(db => {
        getNeonClient = db.getNeonClient;
    });
}

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
            // Always log to console in development for debugging
            if (process.env.NODE_ENV !== 'production') {
                console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'info'](
                    `[${level.toUpperCase()}][${source}] ${message}`,
                    details || '',
                    options || ''
                );
            }

            // Only attempt database logging on the server side
            if (typeof window === 'undefined' && getNeonClient) {
                try {
                    const client = getNeonClient();

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
                } catch (dbErr) {
                    console.error('[Logger] Failed to write log to database:', dbErr);
                }
            }
        } catch (err) {
            // Fallback to console logging if logging fails
            // This prevents logging failures from breaking application flow
            console.error('[Logger] Failed to log:', err);
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
    // Helper function to extract userId and clean details
    const prepareDetailsAndHeaders = (details?: Record<string, any>) => {
        // Extract userId from details if available
        const userId = details?.userId;

        // Create a clean details object without userId to avoid duplication
        let cleanDetails: Record<string, any> | undefined = undefined;

        if (details) {
            // Use object destructuring to remove userId and create a new object
            const { userId: _, ...restDetails } = details;
            cleanDetails = Object.keys(restDetails).length > 0 ? restDetails : undefined;
        }

        // Prepare headers with the content type
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        // Add user ID to headers if available
        if (userId) {
            headers['x-user-id'] = userId.toString();
        }

        return { headers, cleanDetails };
    };

    // Helper to get base URL for API endpoint
    const getBaseUrl = () => {
        return typeof window !== 'undefined'
            ? `${window.location.protocol}//${window.location.host}`
            : '';
    };

    // Helper to send log to server
    const sendLogToServer = async (
        level: LogLevel,
        message: string,
        details?: Record<string, any>
    ) => {
        try {
            const baseUrl = getBaseUrl();
            const { headers, cleanDetails } = prepareDetailsAndHeaders(details);

            await fetch(`${baseUrl}/api/system/log`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    level,
                    source,
                    message,
                    details: cleanDetails
                })
            });
        } catch (e) {
            console.error(`[useLogger] Failed to send ${level} to server:`, e);
        }
    };

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

        await sendLogToServer('error', message, details);
    };

    const logClientWarning = async (
        message: string,
        details?: Record<string, any>
    ) => {
        console.warn(`[${source}] ${message}`, details);
        await sendLogToServer('warning', message, details);
    };

    const logClientInfo = async (
        message: string,
        details?: Record<string, any>
    ) => {
        if (process.env.NODE_ENV !== 'production') {
            console.info(`[${source}] ${message}`, details);
        }

        await sendLogToServer('info', message, details);
    };

    return {
        error: logClientError,
        warning: logClientWarning,
        info: logClientInfo
    };
}
