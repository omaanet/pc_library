import assert from 'node:assert/strict';
import test from 'node:test';
import { analyticsConfig, createAnalyticsClient, normalizeResponse, AnalyticsError } from './client';
import { dayBounds, periodBounds, romeDate, romeMidnight } from './dates';
import { buildDashboard, checkSetup, enrichBookTitles, parseAnalyticsParams } from './service';
import { analyticsRoute, databaseSchemaDiagnostic } from './route-handler';
import { ApiError } from '../api-error-handler';
import { createAudioTracking, createBookTracking, uniquePlayedSeconds, type SendEvent } from './tracking';
import { initialStatisticsTab, TAB_STORAGE_KEY } from './tab-preference';

const config = { token: 'secret-never-return-this', projectId: 'project-test', customEnabled: false };
const now = new Date('2026-09-09T10:00:00Z');
const bounds = { since: '2026-09-09T00:00:00Z', until: now.toISOString() };
const reply = (data: unknown, status = 200, headers?: Record<string, string>) => new Response(JSON.stringify(data), { status, headers });
const fakeFetch = (fn: (url: URL, init?: RequestInit) => Promise<Response> | Response) => ((url: string | URL | Request, init?: RequestInit) => fn(new URL(String(url)), init)) as typeof fetch;
function storage() {
    const map = new Map<string, string>();
    return { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); }, removeItem: (key: string) => { map.delete(key); } };
}

test('Rome calendar periods include today and respect both DST changes', () => {
    assert.equal(romeMidnight('2026-03-29').toISOString(), '2026-03-28T23:00:00.000Z');
    assert.equal(romeMidnight('2026-03-30').toISOString(), '2026-03-29T22:00:00.000Z');
    assert.equal(romeMidnight('2026-10-25').toISOString(), '2026-10-24T22:00:00.000Z');
    assert.equal(romeMidnight('2026-10-26').toISOString(), '2026-10-25T23:00:00.000Z');
    const spring = dayBounds('2026-03-29', new Date('2026-04-01'));
    const autumn = dayBounds('2026-10-25', new Date('2026-11-01'));
    assert.equal(Date.parse(spring.until) - Date.parse(spring.since) + 1, 23 * 3_600_000);
    assert.equal(Date.parse(autumn.until) - Date.parse(autumn.since) + 1, 25 * 3_600_000);
    assert.equal(romeDate(new Date('2026-09-08T22:01:00Z')), '2026-09-09');
    assert.equal(periodBounds('30d', now).dates.length, 30);
    assert.equal(periodBounds('today', now).until, now.toISOString());
});
test('parameters reject injection, duplicate values and unbounded limits', () => {
    assert.deepEqual(parseAnalyticsParams(new URLSearchParams()), { period: '7d', limit: 10 });
    for (const query of ['period=all', 'limit=999', 'limit=05', 'projectId=other', 'filter=x', 'period=7d&period=30d']) assert.throws(() => parseAnalyticsParams(new URLSearchParams(query)));
});
test('normalization distinguishes malformed responses from empty traffic', () => {
    assert.deepEqual(normalizeResponse({ data: [] }, 'visits'), []);
    assert.equal(normalizeResponse({ data: { pageviews: 2, visitors: 1 } }, 'visits')[0].pageviews, 2);
    for (const data of [null, {}, { data: null }, { data: [{ pageviews: '1', visitors: 1 }] }, { data: [{ count: -1, visitors: 0 }] }]) assert.throws(() => normalizeResponse(data, 'visits'), AnalyticsError);
});
test('client sends only server credentials, caches successes, and checks uncached', async () => {
    let requests = 0; let tick = 0;
    const client = createAnalyticsClient({ ...config, teamId: 'team-test' }, fakeFetch((url, init) => {
        requests++;
        assert.equal(url.hostname, 'api.vercel.com');
        assert.equal(url.searchParams.get('teamId'), 'team-test');
        assert.equal(url.searchParams.get('filter'), "environment eq 'production'");
        assert.equal((init?.headers as Record<string, string>).Authorization, `Bearer ${config.token}`);
        assert.equal(url.toString().includes(config.token), false);
        return reply({ data: [{ pageviews: 2, visitors: 1 }] });
    }), () => tick);
    await Promise.all([client.query(bounds), client.query(bounds)]);
    assert.equal(requests, 1);
    await client.query(bounds); assert.equal(requests, 1);
    await client.query(bounds, true); assert.equal(requests, 2);
    tick = 300_001; await client.query(bounds); assert.equal(requests, 3);
});
test('rate limit prevents queued calls until Retry-After elapses', async () => {
    let requests = 0; let tick = 0;
    const client = createAnalyticsClient(config, fakeFetch(() => { requests++; return requests === 1 ? reply({}, 429, { 'retry-after': '10' }) : reply({ data: [] }); }), () => tick);
    await assert.rejects(client.query(bounds), (error: AnalyticsError) => error.code === 'rate_limit' && error.retryAfter === 10);
    await assert.rejects(client.query(bounds), AnalyticsError); assert.equal(requests, 1);
    tick = 10_001; await client.query(bounds); assert.equal(requests, 2);
});
test('outbound concurrency is bounded to four', async () => {
    let active = 0; let peak = 0;
    const client = createAnalyticsClient(config, fakeFetch(async () => { active++; peak = Math.max(peak, active); await new Promise(resolve => setTimeout(resolve, 2)); active--; return reply({ data: [] }); }));
    await Promise.all(Array.from({ length: 12 }, (_, index) => client.query({ ...bounds, filter: `country eq '${index}'` })));
    assert.equal(peak, 4);
});
test('dashboard keeps period uniques independent from daily uniques and preserves partial failures', async () => {
    const client = createAnalyticsClient(config, fakeFetch(url => {
        assert.equal(url.pathname.includes('/events/'), false);
        const by = url.searchParams.get('by');
        if (by === 'country') return reply({}, 503);
        if (by === 'requestPath') return reply({ data: [{ requestPath: 'Others', pageviews: 3, visitors: 2 }] });
        if (by !== 'environment') return reply({ data: [] });
        return reply({ data: [{ pageviews: 10, visitors: 4 }] });
    }));
    const result = await buildDashboard(client, config, '7d', 10, now);
    assert.equal(result.summaries['7d'].data?.visitors, 4);
    assert.equal(result.daily.reduce((sum, day) => sum + (day.visitors || 0), 0), 28);
    assert.equal(result.rankings.countries.error?.code, 'upstream');
    assert.equal(result.rankings.pages.data?.[0].name, 'Others');
    assert.equal(result.custom, null);
    assert.equal(JSON.stringify(result).includes(config.token), false);
});
test('zero visitors produce no ratio and successful empty sections remain empty', async () => {
    const result = await buildDashboard(createAnalyticsClient(config, fakeFetch(() => reply({ data: [] }))), config, 'today', 5, now);
    assert.equal(result.summaries.today.data?.pageviews, 0);
    assert.equal(result.summaries.today.data?.pagesPerVisitor, null);
    assert.deepEqual(result.rankings.pages.data, []);
});
test('custom events query source and originating view-date cohorts; titles resolve in one batch', async () => {
    const filters: string[] = [];
    const enabledConfig = { ...config, customEnabled: true };
    const client = createAnalyticsClient(enabledConfig, fakeFetch(url => {
        const event = url.pathname.includes('/events/'); const by = url.searchParams.get('by'); const filter = url.searchParams.get('filter')!;
        filters.push(filter);
        if (by === 'eventData/bookId') return reply({ data: [{ eventData: 'book-1', count: 2, visitors: 1 }] });
        if (by !== 'environment') return reply({ data: [] });
        return reply({ data: event ? [{ count: filter.includes('book_reader_conversion') ? 1 : 2, visitors: 1 }] : [{ pageviews: 2, visitors: 1 }] });
    }));
    const result = await buildDashboard(client, enabledConfig, 'today', 10, now);
    assert.equal(result.custom?.conversionRate, 50);
    assert.ok(filters.some(filter => filter.includes("eventData/viewDate in ('2026-09-09')")));
    assert.ok(filters.some(filter => filter.includes("eventData/source eq 'promo'")));
    let lookups = 0;
    await enrichBookTitles(result, async ids => { lookups++; assert.deepEqual(ids, ['book-1']); return [{ id: 'book-1', title: 'Racconto' }]; });
    assert.equal(lookups, 1); assert.equal(result.custom?.topBooks.data?.[0].name, 'Racconto');
});
test('setup check reports missing configuration without requests or secrets', async () => {
    const emptyConfig = analyticsConfig({} as NodeJS.ProcessEnv);
    const result = await checkSetup(createAnalyticsClient(emptyConfig, fakeFetch(() => { throw new Error('must not fetch'); })), emptyConfig, now);
    assert.deepEqual(result.configuration.missing, ['VERCEL_TOKEN', 'VERCEL_PROJECT_ID']);
    assert.equal(result.api.error?.code, 'configuration'); assert.equal(result.collection, 'unknown'); assert.equal(result.custom, 'disabled');
});
test('setup check distinguishes successful access with and without collection', async () => {
    for (const pageviews of [0, 2]) {
        const result = await checkSetup(createAnalyticsClient(config, fakeFetch(() => reply({ data: [{ pageviews, visitors: pageviews }] }))), config, now);
        assert.equal(result.api.data, true); assert.equal(result.collection, pageviews ? 'received' : 'unconfirmed');
    }
});
test('setup check sanitizes rejection, timeout, rate limits and malformed responses', async () => {
    for (const [status, code] of [[401, 'credentials'], [403, 'access'], [402, 'unavailable'], [404, 'unavailable'], [429, 'rate_limit'], [500, 'upstream']] as const) {
        const result = await checkSetup(createAnalyticsClient(config, fakeFetch(() => reply({ token: config.token }, status))), config, now);
        assert.equal(result.api.error?.code, code); assert.equal(result.api.data, null); assert.equal(result.collection, 'unknown'); assert.equal(JSON.stringify(result).includes(config.token), false);
    }
    const timeout = await checkSetup(createAnalyticsClient(config, fakeFetch(() => { throw new DOMException('secret', 'TimeoutError'); })), config, now);
    assert.equal(timeout.api.error?.code, 'timeout');
    const malformed = await checkSetup(createAnalyticsClient(config, fakeFetch(() => reply({ data: [{ bad: 1 }] }))), config, now);
    assert.equal(malformed.api.error?.code, 'response');
});
test('setup event access is separate from successful pageview access', async () => {
    const enabledConfig = { ...config, customEnabled: true };
    const result = await checkSetup(createAnalyticsClient(enabledConfig, fakeFetch(url => url.pathname.includes('events') ? reply({}, 403) : reply({ data: [] }))), enabledConfig, now);
    assert.equal(result.api.data, true); assert.notEqual(result.custom, 'disabled');
    if (result.custom !== 'disabled') assert.equal(result.custom.error?.code, 'access');
});
test('route authorizes before data/cache access and never serializes unknown exceptions', async () => {
    let calls = 0;
    for (const status of [401, 403]) {
        const response = await analyticsRoute(new Request('https://example.test/api/admin/analytics'), { authorize: async () => { throw new ApiError(status, config.token); }, dashboard: async () => { calls++; return {}; } });
        assert.equal(response.status, status); assert.equal((await response.text()).includes(config.token), false);
        assert.equal(response.headers.get('cache-control'), 'private, no-store');
    }
    assert.equal(calls, 0);
    const response = await analyticsRoute(new Request('https://example.test/api/admin/analytics?projectId=other'), { authorize: async () => {}, dashboard: async () => { calls++; return {}; } });
    assert.equal(response.status, 400); assert.equal(calls, 0);
});
test('database schema diagnostics are sanitized and returned only with a superadmin capability', async () => {
    const databaseError = Object.assign(new Error('relation "vercel_analytics_cache_scopes" does not exist'), {
        code: '42P01', table: 'vercel_analytics_cache_scopes', detail: 'Missing cache relation', sql: 'private query', params: ['private value'],
    });
    assert.deepEqual(databaseSchemaDiagnostic(databaseError), {
        kind: 'database_schema', code: '42P01', message: 'relation "vercel_analytics_cache_scopes" does not exist',
        detail: 'Missing cache relation', table: 'vercel_analytics_cache_scopes',
    });
    const request = () => new Request('https://example.test/api/admin/analytics');
    const ordinary = await analyticsRoute(request(), { authorize: async () => ({ diagnostics: false }), dashboard: async () => { throw databaseError; } });
    assert.equal(ordinary.status, 500);
    assert.equal('diagnostic' in await ordinary.json(), false);
    const superadmin = await analyticsRoute(request(), { authorize: async () => ({ diagnostics: true }), dashboard: async () => { throw databaseError; } });
    const body = await superadmin.json();
    assert.equal(body.diagnostic.code, '42P01');
    assert.equal(JSON.stringify(body).includes('private query'), false);
    assert.equal(JSON.stringify(body).includes('private value'), false);
    const unrelated = await analyticsRoute(request(), { authorize: async () => ({ diagnostics: true }), dashboard: async () => { throw Object.assign(new Error('secret connection failure'), { code: '08006' }); } });
    assert.equal('diagnostic' in await unrelated.json(), false);
});
test('tab migration overrides old selection once, then remembers new choices; storage optional', () => {
    const saved = storage(); saved.setItem('user-statistics-active-tab', 'audio');
    assert.equal(initialStatisticsTab(saved), 'vercel');
    saved.setItem(TAB_STORAGE_KEY, 'reading'); assert.equal(initialStatisticsTab(saved), 'reading');
    saved.setItem(TAB_STORAGE_KEY, 'invalid'); assert.equal(initialStatisticsTab(saved), 'vercel');
    assert.equal(initialStatisticsTab({ getItem: () => { throw new Error(); }, setItem: () => {} }), 'vercel');
});
test('direct reader opens count; detail attribution is same-book, consumed once, expires and crosses midnight', () => {
    const events: [string, Record<string, string>][] = []; const send: SendEvent = (name, props) => { events.push([name, props]); };
    let time = Date.parse('2026-09-08T21:50:00Z');
    const saved = storage(); const tracker = createBookTracking(send, () => saved, () => time);
    tracker.reader('direct'); assert.deepEqual(events.map(e => e[0]), ['reader_open']);
    tracker.view('book'); time += 15 * 60_000; tracker.reader('other'); tracker.reader('book'); tracker.reader('book');
    assert.equal(events.filter(e => e[0] === 'book_reader_conversion').length, 1);
    assert.equal(events.find(e => e[0] === 'book_reader_conversion')?.[1].viewDate, '2026-09-08');
    tracker.view('expired'); time += 31 * 60_000; tracker.reader('expired');
    assert.equal(events.filter(e => e[0] === 'book_reader_conversion').length, 1);
});
test('blocked storage and tracking failures never interrupt reader or detail views', () => {
    const tracker = createBookTracking(() => { throw new Error(); }, () => { throw new Error(); });
    assert.doesNotThrow(() => { tracker.view('book'); tracker.reader('book'); });
});
test('audio excludes intro, deduplicates resume, and completes only at unique 50% coverage', () => {
    const events: string[] = []; const tracker = createAudioTracking(name => { events.push(name); }, 'book', 'promo');
    tracker.start('intro'); tracker.coverage('intro', 100, 100); assert.deepEqual(events, []);
    tracker.start('main'); tracker.start('main'); tracker.coverage('main', 49.9, 100); assert.deepEqual(events, ['audio_start']);
    tracker.coverage('main', 50, 100); tracker.coverage('main', 99, 100); assert.deepEqual(events, ['audio_start', 'audio_complete']);
    const played = (values: [number, number][]) => ({ length: values.length, start: (i: number) => values[i][0], end: (i: number) => values[i][1] });
    assert.equal(uniquePlayedSeconds(played([[0, 10], [5, 15], [80, 90]]), 100), 25);
    assert.equal(uniquePlayedSeconds(played([[80, 90]]), 100), 10);
    assert.equal(uniquePlayedSeconds(played([]), 100), 0);
    assert.equal(uniquePlayedSeconds(played([[0, 100]]), Infinity), 0);
});
