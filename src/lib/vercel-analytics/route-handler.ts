import { NextResponse } from 'next/server';
import { ApiError } from '@/lib/api-error-handler';
import { parseAnalyticsParams } from './service';
import { AnalyticsError } from './client';
import type { AnalyticsLimit, AnalyticsPeriod, DatabaseSchemaDiagnostic } from './types';

const headers = { 'Cache-Control': 'private, no-store' };
const schemaErrorCodes = new Set([
    '3F000', // invalid_schema_name
    '42P01', // undefined_table
    '42703', // undefined_column
    '42883', // undefined_function
    '42704', // undefined_object
    '42P06', // duplicate_schema
    '42P07', // duplicate_table
    '42701', // duplicate_column
    '42710', // duplicate_object
]);

type ErrorRecord = Record<string, unknown>;
const limitedString = (value: unknown) => typeof value === 'string' && value.length > 0 ? value.slice(0, 500) : undefined;

/** Return only schema metadata that is useful for migration troubleshooting. */
export function databaseSchemaDiagnostic(error: unknown): DatabaseSchemaDiagnostic | null {
    let current = error;
    for (let depth = 0; depth < 3 && current && typeof current === 'object'; depth++) {
        const value = current as ErrorRecord;
        const code = limitedString(value.code);
        const message = limitedString(value.message);
        if (code && message && schemaErrorCodes.has(code)) {
            return {
                kind: 'database_schema', code, message,
                ...(limitedString(value.detail) ? { detail: limitedString(value.detail) } : {}),
                ...(limitedString(value.hint) ? { hint: limitedString(value.hint) } : {}),
                ...(limitedString(value.schema) ? { schema: limitedString(value.schema) } : {}),
                ...(limitedString(value.table) ? { table: limitedString(value.table) } : {}),
                ...(limitedString(value.column) ? { column: limitedString(value.column) } : {}),
            };
        }
        current = value.cause || value.sourceError;
    }
    return null;
}

export async function analyticsRoute(request: Request, dependencies: {
    authorize: () => Promise<unknown>;
    dashboard?: (period: AnalyticsPeriod, limit: AnalyticsLimit) => Promise<unknown>;
    check?: () => Promise<unknown>;
}) {
    let authorization: unknown;
    try {
        authorization = await dependencies.authorize();
        if (request.method === 'POST' && (await request.text()).trim()) return NextResponse.json({ error: 'Parametri non validi.' }, { status: 400, headers });
        const params = new URL(request.url).searchParams;
        let result: unknown;
        if (dependencies.check) {
            if ([...params.keys()].length) return NextResponse.json({ error: 'Parametri non validi.' }, { status: 400, headers });
            result = await dependencies.check();
        } else {
            let parsed;
            try { parsed = parseAnalyticsParams(params); } catch { return NextResponse.json({ error: 'Parametri non validi.' }, { status: 400, headers }); }
            result = await dependencies.dashboard!(parsed.period, parsed.limit);
        }
        return NextResponse.json(result, { headers });
    } catch (error) {
        if (error instanceof AnalyticsError) return NextResponse.json({ error: 'Statistiche temporaneamente non disponibili.', code: error.code, retryAfter: error.retryAfter }, { status: 503, headers: { ...headers, ...(error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {}) } });
        // Never serialize provider errors or configuration values.
        const status = error instanceof ApiError && [401, 403].includes(error.statusCode) ? error.statusCode : 500;
        const diagnostic = status === 500 && Boolean((authorization as { diagnostics?: boolean } | undefined)?.diagnostics)
            ? databaseSchemaDiagnostic(error)
            : null;
        return NextResponse.json({
            error: status === 401 ? 'Autenticazione richiesta.' : status === 403 ? 'Accesso alle statistiche non consentito.' : 'Statistiche temporaneamente non disponibili.',
            ...(diagnostic ? { diagnostic } : {}),
        }, { status, headers });
    }
}
