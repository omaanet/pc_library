import { createHash, randomUUID } from 'node:crypto';
import { AnalyticsError, issue, type AnalyticsConfig } from './client';
import { romeDate } from './dates';
import type { AnalyticsDashboard, AnalyticsIssue, AnalyticsLimit, AnalyticsPeriod } from './types';

export const CACHE_TTL = 600_000;
const LEASE_MS = 180_000;
type Row = Record<string, unknown>;
export type CacheQuery = (sql: string, params: unknown[]) => Promise<Row[]>;
export function cacheNamespace(config: AnalyticsConfig): string {
    return createHash('sha256').update(JSON.stringify(['v2', config.projectId, config.teamId || '', config.customEnabled])).digest('hex');
}
export function dashboardKey(period: AnalyticsPeriod, limit: AnalyticsLimit, now: Date): string {
    return `${romeDate(now)}:${period}:${limit}`;
}
function issues(value: unknown): AnalyticsIssue[] {
    if (!value || typeof value !== 'object') return [];
    if ('code' in value) return [value as AnalyticsIssue];
    return Object.values(value).flatMap(issues);
}
function retainSuccessfulSections(fresh: AnalyticsDashboard, old?: AnalyticsDashboard): AnalyticsDashboard {
    if (!old) return fresh;
    const merge = (next: unknown, previous: unknown): unknown => {
        if (!next || typeof next !== 'object' || !previous || typeof previous !== 'object') return next;
        if ('error' in next && 'data' in next && next.data === null && 'data' in previous) return { ...next, data: previous.data };
        if (Array.isArray(next)) return next.map((value, index) => merge(value, (previous as unknown[])[index]));
        return Object.fromEntries(Object.entries(next).map(([key, value]) => [key, merge(value, (previous as Row)[key])]));
    };
    const result = merge(fresh, old) as AnalyticsDashboard;
    result.daily = fresh.daily.map(day => day.error ? { ...(old.daily.find(previous => previous.date === day.date) || day), error: day.error } : day);
    result.updatedAt = old.updatedAt;
    return result;
}

/** DB leases serialize fills across server instances; generation fencing protects refreshes. */
export function createSharedCache(query: CacheQuery, clock = Date.now, sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))) {
    const ensure = (namespace: string) => query('INSERT INTO vercel_analytics_cache_scopes(namespace) VALUES ($1) ON CONFLICT DO NOTHING', [namespace]);
    return {
        async invalidate(namespace: string) {
            await ensure(namespace);
            // Keep any running lease and Retry-After: refresh must not multiply upstream traffic.
            await query('UPDATE vercel_analytics_cache_scopes SET generation = generation + 1 WHERE namespace = $1', [namespace]);
        },
        async get(namespace: string, key: string, build: () => Promise<AnalyticsDashboard>): Promise<AnalyticsDashboard> {
            await ensure(namespace);
            const deadline = clock() + LEASE_MS + 10_000;
            while (clock() < deadline) {
                const now = clock();
                const [state] = await query(`SELECT s.generation, s.retry_until, s.retry_issue, e.payload, e.expires_at,
                    e.generation AS entry_generation FROM vercel_analytics_cache_scopes s
                    LEFT JOIN vercel_analytics_cache_entries e ON e.namespace = s.namespace AND e.cache_key = $2
                    WHERE s.namespace = $1`, [namespace, key]);
                const old = state.payload as AnalyticsDashboard | undefined;
                const expires = state.expires_at ? new Date(state.expires_at as string).getTime() : 0;
                if (old && String(state.generation) === String(state.entry_generation) && expires > now) return old;
                const retry = state.retry_until ? new Date(state.retry_until as string).getTime() : 0;
                if (retry > now) {
                    const problem = state.retry_issue as AnalyticsIssue;
                    const retryAfter = Math.ceil((retry - now) / 1000);
                    if (old) return { ...old, cache: { expiresAt: new Date(expires).toISOString(), stale: true, retryAfter }, warnings: [...old.warnings, { ...problem, retryAfter }] };
                    throw new AnalyticsError(problem?.code || 'upstream', retryAfter);
                }
                const owner = randomUUID();
                const [lease] = await query(`UPDATE vercel_analytics_cache_scopes SET lease_owner=$2, lease_until=$3
                    WHERE namespace=$1 AND generation=$4 AND (lease_until IS NULL OR lease_until <= $5)
                    AND (retry_until IS NULL OR retry_until <= $5)
                    AND NOT EXISTS (SELECT 1 FROM vercel_analytics_cache_entries e WHERE e.namespace=$1
                        AND e.cache_key=$6 AND e.generation=$4 AND e.expires_at > $5) RETURNING generation`,
                    [namespace, owner, new Date(now + LEASE_MS).toISOString(), state.generation, new Date(now).toISOString(), key]);
                if (!lease) { await sleep(300); continue; }
                try {
                    // A competing publisher may have committed while our UPDATE waited for its row lock.
                    const [filled] = await query(`SELECT payload FROM vercel_analytics_cache_entries
                        WHERE namespace=$1 AND cache_key=$2 AND generation=$3 AND expires_at > $4`,
                        [namespace, key, lease.generation, new Date(clock()).toISOString()]);
                    if (filled) return filled.payload as AnalyticsDashboard;
                    let value: AnalyticsDashboard;
                    try { value = await build(); }
                    catch (error) {
                        const problem = issue(error);
                        await query(`UPDATE vercel_analytics_cache_scopes SET retry_until=$3, retry_issue=$4::jsonb
                            WHERE namespace=$1 AND lease_owner=$2 AND generation=$5`,
                            [namespace, owner, new Date(clock() + (problem.retryAfter || 30) * 1000).toISOString(), JSON.stringify(problem), lease.generation]);
                        if (!old) throw error;
                        return { ...old, cache: { expiresAt: new Date(expires).toISOString(), stale: true }, warnings: [...old.warnings, problem] };
                    }
                    const problems = issues(value);
                    const retrySeconds = problems.length ? Math.max(30, ...problems.map(problem => problem.retryAfter || 0)) : 0;
                    if (problems.length) value = retainSuccessfulSections(value, old);
                    value.cache = { expiresAt: new Date(problems.length ? clock() : clock() + CACHE_TTL).toISOString(), stale: problems.length > 0, ...(retrySeconds ? { retryAfter: retrySeconds } : {}) };
                    const [published] = await query(`WITH owned AS (
                        UPDATE vercel_analytics_cache_scopes SET retry_until=$6, retry_issue=$7::jsonb
                        WHERE namespace=$1 AND lease_owner=$2 AND generation=$3 AND lease_until > $8 RETURNING namespace
                    ) INSERT INTO vercel_analytics_cache_entries(namespace,cache_key,generation,payload,expires_at)
                    SELECT namespace,$4,$3,$5::jsonb,$9 FROM owned
                    ON CONFLICT(namespace,cache_key) DO UPDATE SET generation=EXCLUDED.generation,payload=EXCLUDED.payload,expires_at=EXCLUDED.expires_at
                    RETURNING cache_key`, [namespace, owner, lease.generation, key, JSON.stringify(value),
                        retrySeconds ? new Date(clock() + retrySeconds * 1000).toISOString() : null,
                        problems.length ? JSON.stringify(problems.find(problem => problem.code === 'rate_limit') || problems[0]) : null,
                        new Date(clock()).toISOString(), value.cache.expiresAt]);
                    if (published) return value;
                    // Refresh changed the generation while this loader ran. Discard its result.
                } finally {
                    await query('UPDATE vercel_analytics_cache_scopes SET lease_owner=NULL, lease_until=NULL WHERE namespace=$1 AND lease_owner=$2', [namespace, owner]);
                }
            }
            throw new AnalyticsError('timeout');
        },
    };
}
