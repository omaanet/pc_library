import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { after, before } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { AnalyticsError } from './client';
import { cacheNamespace, createSharedCache, dashboardKey, CACHE_TTL, type CacheQuery } from './shared-cache';
import { buildDashboard } from './service';

const db = new PGlite();
const query: CacheQuery = async (sql, params) => (await db.query<Record<string, unknown>>(sql, params)).rows;
const start = Date.parse('2026-09-09T10:00:00Z');
const config = { token: 'DO-NOT-STORE', projectId: 'test', customEnabled: false };
before(async () => {
    const migration = await readFile(new URL('../../../scripts/migrations/20260909_vercel_analytics_cache.sql', import.meta.url), 'utf8');
    await db.exec(migration); await db.exec(migration);
});
after(() => db.close());
async function dashboard(value = 1) {
    return buildDashboard({ query: async () => [{ pageviews: value * 2, visitors: value }] }, config, '7d', 10, new Date(start));
}
const wait = () => new Promise<void>(resolve => setTimeout(resolve, 2));

test('two independent instances share one concurrent fill; TTL starts at publication', async () => {
    let tick = start; let fills = 0;
    const a = createSharedCache(query, () => tick, wait);
    const b = createSharedCache(query, () => tick, wait);
    const build = async () => { fills++; await wait(); tick += 100; return dashboard(fills); };
    const [one, two] = await Promise.all([a.get('shared', '7:10', build), b.get('shared', '7:10', build)]);
    assert.equal(fills, 1); assert.deepEqual(one, two);
    assert.equal(Date.parse(one.cache!.expiresAt), tick + CACHE_TTL);
    tick += CACHE_TTL - 1; await b.get('shared', '7:10', build); assert.equal(fills, 1);
    tick += 1; await a.get('shared', '7:10', build); assert.equal(fills, 2);
});
test('refresh invalidates all variants and stale writers cannot publish', async () => {
    const a = createSharedCache(query, () => start, wait), b = createSharedCache(query, () => start, wait);
    await a.get('refresh', '30:50', () => dashboard(1));
    let release!: () => void; let entered!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    const blocked = new Promise<void>(resolve => { release = resolve; });
    let calls = 0;
    const pending = a.get('refresh', '7:10', async () => { if (++calls === 1) { entered(); await blocked; return dashboard(1); } return dashboard(9); });
    await started; await b.invalidate('refresh'); release();
    const value = await pending;
    assert.equal(value.summaries['7d'].data!.visitors, 9);
    assert.equal(calls, 2);
    const other = await b.get('refresh', '30:50', () => dashboard(12));
    assert.equal(other.summaries['7d'].data!.visitors, 12);
});
test('a delayed cache miss does not rebuild after another instance has published', async () => {
    let resume!: () => void; let signal!: () => void;
    const blocked = new Promise<void>(resolve => { resume = resolve; });
    const observed = new Promise<void>(resolve => { signal = resolve; });
    let firstRead = true;
    const delayedQuery: CacheQuery = async (sql, params) => {
        const rows = await query(sql, params);
        if (firstRead && sql.includes('LEFT JOIN')) { firstRead = false; signal(); await blocked; }
        return rows;
    };
    const a = createSharedCache(delayedQuery, () => start, wait), b = createSharedCache(query, () => start, wait);
    let fills = 0;
    const build = () => { fills++; return dashboard(8); };
    const pending = a.get('delayed', '7:10', build);
    await observed; await b.get('delayed', '7:10', build); resume();
    assert.equal((await pending).summaries['7d'].data!.visitors, 8);
    assert.equal(fills, 1);
});
test('partial failures retain successful sections and share backoff across variants and instances', async () => {
    let tick = start;
    const a = createSharedCache(query, () => tick, wait), b = createSharedCache(query, () => tick, wait);
    const initial = await a.get('partial', '7:10', () => dashboard(5));
    tick += CACHE_TTL;
    let fills = 0;
    const partial = await a.get('partial', '7:10', async () => {
        fills++;
        const result = await dashboard(9);
        result.summaries['7d'] = { data: null, error: { code: 'rate_limit', retryAfter: 90 } };
        return result;
    });
    assert.equal(partial.summaries['7d'].data!.visitors, 5);
    assert.equal(partial.summaries.today.data!.visitors, 9);
    assert.equal(partial.updatedAt, initial.updatedAt);
    assert.equal(partial.cache!.stale, true);
    const cached = await b.get('partial', '7:10', async () => { fills++; return dashboard(); });
    assert.equal(cached.cache!.stale, true); assert.equal(fills, 1);
    await b.invalidate('partial');
    await assert.rejects(b.get('partial', '30:50', () => dashboard()), (error: AnalyticsError) => error.code === 'rate_limit' && error.retryAfter === 90);
    tick += 90_000;
    assert.equal((await b.get('partial', '7:10', () => dashboard(11))).cache!.stale, false);
});
test('cold partial responses preserve good sections and thrown failures retain last data', async () => {
    let tick = start;
    const cache = createSharedCache(query, () => tick, wait);
    const partial = await cache.get('cold', '7:10', async () => {
        const result = await dashboard(3); result.rankings.countries = { data: null, error: { code: 'timeout' } }; return result;
    });
    assert.equal(partial.summaries['7d'].data!.visitors, 3); assert.equal(partial.cache!.stale, true);
    tick += 31_000;
    const stale = await cache.get('cold', '7:10', async () => { throw new AnalyticsError('timeout'); });
    assert.equal(stale.summaries['7d'].data!.visitors, 3); assert.equal(stale.cache!.stale, true);
    await assert.rejects(cache.get('cold', '30:10', () => dashboard()), AnalyticsError);
});
test('expired leases recover and unavailable database never bypasses shared cache', async () => {
    const cache = createSharedCache(query, () => start, wait);
    await cache.invalidate('lease');
    await query('UPDATE vercel_analytics_cache_scopes SET lease_owner=$2, lease_until=$3 WHERE namespace=$1', ['lease', 'crashed', new Date(start - 1).toISOString()]);
    assert.equal((await cache.get('lease', '7:10', () => dashboard())).cache!.stale, false);
    let calls = 0;
    const broken = createSharedCache(async () => { throw new Error('database unavailable'); });
    await assert.rejects(broken.get('broken', '7:10', async () => { calls++; return dashboard(); }));
    assert.equal(calls, 0);
});
test('keys isolate scope, Top, calendar dates, feature flag and never contain credentials', async () => {
    assert.equal(cacheNamespace(config), cacheNamespace({ ...config, token: 'rotated' }));
    assert.notEqual(cacheNamespace(config), cacheNamespace({ ...config, teamId: 'other' }));
    assert.notEqual(cacheNamespace(config), cacheNamespace({ ...config, customEnabled: true }));
    assert.notEqual(dashboardKey('7d', 5, new Date(start)), dashboardKey('7d', 50, new Date(start)));
    assert.notEqual(dashboardKey('7d', 10, new Date('2026-10-24T21:59:59Z')), dashboardKey('7d', 10, new Date('2026-10-24T22:00:00Z')));
    assert.equal(dashboardKey('7d', 10, new Date('2026-10-25T22:59:59Z')), '2026-10-25:7d:10');
    assert.equal(dashboardKey('7d', 10, new Date('2026-10-25T23:00:00Z')), '2026-10-26:7d:10');
    const cache = createSharedCache(query, () => start, wait);
    await cache.get(cacheNamespace(config), '7:10', () => dashboard());
    const stored = await query('SELECT * FROM vercel_analytics_cache_entries WHERE namespace=$1', [cacheNamespace(config)]);
    assert.equal(JSON.stringify(stored).includes(config.token), false);
});
