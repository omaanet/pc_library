import type { AnalyticsIssue, IssueCode, Section } from './types';

export interface AnalyticsConfig { token: string; projectId: string; teamId?: string; customEnabled: boolean }
export function analyticsConfig(env: NodeJS.ProcessEnv = process.env): AnalyticsConfig {
    return { token: env.VERCEL_TOKEN?.trim() || '', projectId: env.VERCEL_PROJECT_ID?.trim() || '', teamId: env.VERCEL_TEAM_ID?.trim() || undefined, customEnabled: env.NEXT_PUBLIC_VERCEL_CUSTOM_EVENTS_ENABLED === 'true' };
}
export function missingConfig(config: AnalyticsConfig): string[] {
    return [!config.token && 'VERCEL_TOKEN', !config.projectId && 'VERCEL_PROJECT_ID'].filter((key): key is string => Boolean(key));
}
export class AnalyticsError extends Error {
    constructor(public code: IssueCode, public retryAfter?: number) { super(code); }
}
export function issue(error: unknown): AnalyticsIssue {
    return error instanceof AnalyticsError ? { code: error.code, ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}) } : { code: 'upstream' };
}
export async function section<T>(fn: () => Promise<T>): Promise<Section<T>> {
    try { return { data: await fn() }; } catch (error) { return { data: null, error: issue(error) }; }
}
export interface Query { dataset?: 'visits' | 'events'; since: string; until: string; by?: string; limit?: number; filter?: string }
export interface AnalyticsRow { pageviews?: number; count?: number; visitors: number; [key: string]: unknown }
export function normalizeResponse(value: unknown, dataset: 'visits' | 'events'): AnalyticsRow[] {
    if (!value || typeof value !== 'object' || !('data' in value)) throw new AnalyticsError('response');
    const data = (value as { data: unknown }).data;
    const rows = Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : null;
    if (!rows) throw new AnalyticsError('response');
    const metric = dataset === 'visits' ? 'pageviews' : 'count';
    for (const row of rows) {
        if (!row || typeof row !== 'object' || !Number.isFinite(row[metric]) || row[metric] < 0 || !Number.isFinite(row.visitors) || row.visitors < 0) throw new AnalyticsError('response');
    }
    return rows as AnalyticsRow[];
}

// Shared by dashboard and diagnostic requests within each server process.
let running = 0;
const waiting: (() => void)[] = [];
async function acquire() {
    if (running >= 4) await new Promise<void>(resolve => waiting.push(resolve));
    else running++;
}
function release() { const next = waiting.shift(); if (next) next(); else running--; }

export function createAnalyticsClient(config: AnalyticsConfig, fetcher: typeof fetch = fetch, clock = Date.now) {
    const cache = new Map<string, { expires: number; rows: AnalyticsRow[] }>();
    const pending = new Map<string, Promise<AnalyticsRow[]>>();
    let retryAt = 0;
    return {
        async query(query: Query, uncached = false): Promise<AnalyticsRow[]> {
            if (missingConfig(config).length) throw new AnalyticsError('configuration');
            const dataset = query.dataset || 'visits';
            const params = new URLSearchParams({ projectId: config.projectId, since: query.since, until: query.until, by: query.by || 'environment', filter: `environment eq 'production'${query.filter ? ` and (${query.filter})` : ''}` });
            if (config.teamId) params.set('teamId', config.teamId);
            if (query.limit) params.set('limit', String(query.limit));
            const url = `https://api.vercel.com/v1/query/web-analytics/${dataset}/aggregate?${params}`;
            const cached = cache.get(url);
            if (!uncached && cached && cached.expires > clock()) return cached.rows;
            if (!uncached && pending.has(url)) return pending.get(url)!;
            const work = async () => {
                await acquire();
                try {
                    if (retryAt > clock()) throw new AnalyticsError('rate_limit', Math.ceil((retryAt - clock()) / 1000));
                    const response = await fetcher(url, { headers: { Authorization: `Bearer ${config.token}` }, cache: 'no-store', signal: AbortSignal.timeout(10_000) });
                    if (!response.ok) {
                        if (response.status === 429) {
                            const header = response.headers.get('retry-after');
                            const seconds = header && /^\d+$/.test(header) ? Number(header) : header ? Math.ceil((Date.parse(header) - clock()) / 1000) : 60;
                            const delay = Number.isFinite(seconds) ? Math.max(1, seconds) : 60;
                            retryAt = clock() + delay * 1000;
                            throw new AnalyticsError('rate_limit', delay);
                        }
                        throw new AnalyticsError(response.status === 401 ? 'credentials' : response.status === 403 ? 'access' : [402, 404, 410].includes(response.status) ? 'unavailable' : 'upstream');
                    }
                    let payload: unknown;
                    try { payload = await response.json(); } catch { throw new AnalyticsError('response'); }
                    const rows = normalizeResponse(payload, dataset);
                    if (!uncached) {
                        if (cache.size >= 512) cache.delete(cache.keys().next().value!);
                        cache.set(url, { expires: clock() + 300_000, rows });
                    }
                    return rows;
                } catch (error) {
                    if (error instanceof AnalyticsError) throw error;
                    if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) throw new AnalyticsError('timeout');
                    throw new AnalyticsError('upstream');
                } finally { release(); }
            };
            const promise = work();
            if (!uncached) pending.set(url, promise);
            try { return await promise; } finally { if (!uncached) pending.delete(url); }
        },
    };
}
export type AnalyticsClient = ReturnType<typeof createAnalyticsClient>;
let singleton: { key: string; client: AnalyticsClient } | undefined;
export function getAnalyticsClient(config: AnalyticsConfig): AnalyticsClient {
    const key = JSON.stringify(config);
    if (singleton?.key !== key) singleton = { key, client: createAnalyticsClient(config) };
    return singleton.client;
}
