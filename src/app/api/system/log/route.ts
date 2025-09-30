// src/app/api/system/log/route.ts
import { Logger, LogLevel } from '@/lib/logging';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ApiError, HttpStatus } from '@/lib/api-error-handler';

export async function POST(request: NextRequest) {
    try {
        // Parse the log data from the request
        const body = await request.json();
        const { level, source, message, details } = body as {
            level: LogLevel;
            source: string;
            message: string;
            details?: Record<string, any>;
        };

        // Validate required fields
        if (!level || !source || !message) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Missing required log fields');
        }

        // Try to get user ID from auth token in cookies if available
        // We'll extract from the authorization header or other custom headers
        const userId = request.headers.get('x-user-id') || undefined;

        // Extract request context
        const requestPath = request.nextUrl.pathname;
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Log to database based on level
        switch (level) {
            case 'error':
                await Logger.error(source, message, details, {
                    userId,
                    ipAddress,
                    requestPath
                });
                break;
            case 'warning':
                await Logger.warning(source, message, details, {
                    userId,
                    ipAddress,
                    requestPath
                });
                break;
            case 'info':
                await Logger.info(source, message, details, {
                    userId,
                    ipAddress,
                    requestPath
                });
                break;
            default:
                throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid log level');
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in logging API:', error);
        return handleApiError(error, 'Failed to process log', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
