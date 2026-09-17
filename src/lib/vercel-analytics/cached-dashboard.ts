import 'server-only';
import { getNeonClient, extractRows } from '@/lib/db';
import { analyticsConfig, getAnalyticsClient, missingConfig, type AnalyticsClient } from './client';
import { buildDashboard, enrichBookTitles } from './service';
import { cacheNamespace, createSharedCache, dashboardKey } from './shared-cache';
import type { AnalyticsLimit, AnalyticsPeriod } from './types';

export async function cachedDashboard(period: AnalyticsPeriod, limit: AnalyticsLimit, refresh = false) {
    const config = analyticsConfig();
    const client = getAnalyticsClient(config);
    const build = async () => {
        // Deduplicate within this fill, never reuse an older local snapshot.
        const pending = new Map<string, ReturnType<AnalyticsClient['query']>>();
        const fresh: AnalyticsClient = { query: query => {
            const key = JSON.stringify(query);
            if (!pending.has(key)) pending.set(key, client.query(query, true));
            return pending.get(key)!;
        } };
        const result = await buildDashboard(fresh, config, period, limit);
        await enrichBookTitles(result, async ids => extractRows<{ id: string; title: string }>(await getNeonClient().query('SELECT id::text AS id, title FROM books WHERE id::text = ANY($1::text[])', [ids])));
        return result;
    };
    if (missingConfig(config).length) return build();
    const cache = createSharedCache(async (sql, params) => extractRows(await getNeonClient().query(sql, params)));
    const namespace = cacheNamespace(config);
    if (refresh) await cache.invalidate(namespace);
    return cache.get(namespace, dashboardKey(period, limit, new Date()), build);
}
