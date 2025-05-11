// src/app/api/system/log/route.ts
import { Logger, LogLevel } from '@/lib/logging';
import { NextRequest, NextResponse } from 'next/server';

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
            return NextResponse.json(
                { error: 'Missing required log fields' },
                { status: 400 }
            );
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
                return NextResponse.json(
                    { error: 'Invalid log level' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in logging API:', error);
        return NextResponse.json(
            { error: 'Failed to process log' },
            { status: 500 }
        );
    }
}
