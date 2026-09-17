import { AnalyticsError, section, missingConfig, type AnalyticsClient, type AnalyticsConfig, type AnalyticsRow } from './client';
import { TIMEZONE, periodBounds, dayBounds } from './dates';
import type { AnalyticsDashboard, AnalyticsLimit, AnalyticsPeriod, CustomMetrics, DateBounds, Ranking, SetupCheck, Traffic } from './types';

export function parseAnalyticsParams(params: URLSearchParams): { period: AnalyticsPeriod; limit: AnalyticsLimit } {
    if ([...params.keys()].some(key => !['period', 'limit'].includes(key)) || params.getAll('period').length > 1 || params.getAll('limit').length > 1) throw new Error('invalid_parameters');
    const period = params.get('period') || '7d';
    const limit = params.get('limit') || '10';
    if (!['today', '7d', '30d'].includes(period) || !['5', '10', '50'].includes(limit)) throw new Error('invalid_parameters');
    return { period: period as AnalyticsPeriod, limit: Number(limit) as AnalyticsLimit };
}
function total(rows: AnalyticsRow[], metric: 'pageviews' | 'count'): number {
    if (rows.length > 1) throw new AnalyticsError('response');
    return rows[0]?.[metric] ?? 0;
}
function traffic(rows: AnalyticsRow[]): Traffic {
    const pageviews = total(rows, 'pageviews');
    const visitors = rows[0]?.visitors ?? 0;
    return { pageviews, visitors, pagesPerVisitor: visitors ? pageviews / visitors : null };
}
function rank(rows: AnalyticsRow[], dimension: string, metric: 'pageviews' | 'count', books = false): Ranking[] {
    return rows.map(row => {
        const raw = row[dimension];
        if (raw !== null && raw !== undefined && typeof raw !== 'string') throw new AnalyticsError('response');
        const name = typeof raw === 'string' && raw ? raw : '(unknown)';
        return { name, value: row[metric]!, visitors: row.visitors, ...(books && name !== 'Others' && name !== '(unknown)' ? { bookId: name } : {}), ...(dimension === 'requestPath' ? { path: name } : {}) };
    }).sort((a, b) => b.value - a.value);
}
export async function buildDashboard(client: AnalyticsClient, config: AnalyticsConfig, period: AnalyticsPeriod, limit: AnalyticsLimit, now = new Date()): Promise<AnalyticsDashboard> {
    const asOf = now;
    const bounds = periodBounds(period, asOf);
    const countTraffic = (range: DateBounds) => section(async () => traffic(await client.query(range)));
    const ranking = (by: string, filter?: string) => section(async () => rank(await client.query({ ...bounds, by, limit, filter }), by, 'pageviews'));
    const summariesPromise = Promise.all((['today', '7d', '30d'] as const).map(async p => [p, await countTraffic(periodBounds(p, asOf))] as const));
    const dailyPromise = Promise.all(bounds.dates.map(async date => {
        const result = await countTraffic(dayBounds(date, asOf));
        return { date, pageviews: result.data?.pageviews ?? null, visitors: result.data?.visitors ?? null, ...(result.error ? { error: result.error } : {}) };
    }));
    const rankingsPromise = Promise.all([
        ranking('requestPath'), ranking('referrerHostname'), ranking('country'), ranking('deviceType'),
        ranking('requestPath', "startswith(requestPath, '/read-book/')"),
    ]);
    const customPromise = config.customEnabled ? buildCustom(client, bounds, limit) : Promise.resolve(null);
    const [summaries, daily, rankings, custom] = await Promise.all([summariesPromise, dailyPromise, rankingsPromise, customPromise]);
    for (const row of rankings[4].data || []) {
        const match = row.path?.match(/^\/read-book\/([^/]+)\/?$/);
        if (match) { try { row.bookId = decodeURIComponent(match[1]); } catch { /* Keep the original path. */ } }
    }
    return {
        period, timezone: TIMEZONE, bounds, updatedAt: asOf.toISOString(), missing: missingConfig(config),
        summaries: Object.fromEntries(summaries) as AnalyticsDashboard['summaries'], daily,
        rankings: { pages: rankings[0], referrers: rankings[1], countries: rankings[2], devices: rankings[3], readers: rankings[4] },
        customEnabled: config.customEnabled, custom, warnings: [],
    };
}
async function buildCustom(client: AnalyticsClient, bounds: DateBounds, limit: AnalyticsLimit): Promise<CustomMetrics> {
    const count = (event: string, filter = '') => section(async () => total(await client.query({ ...bounds, dataset: 'events', filter: `eventName eq '${event}'${filter ? ` and (${filter})` : ''}` }), 'count'));
    const top = (event: string, filter = '') => section(async () => rank(await client.query({ ...bounds, dataset: 'events', by: 'eventData/bookId', limit, filter: `eventName eq '${event}'${filter ? ` and (${filter})` : ''}` }), 'eventData', 'count', true));
    const cohortFilter = `eventData/viewDate in (${bounds.dates.map(date => `'${date}'`).join(',')})`;
    const [views, readerOpens, conversions, libraryStarts, libraryCompletions, promoStarts, promoCompletions, topBooks, topLibraryAudio, topPromoAudio] = await Promise.all([
        count('book_view'), count('reader_open'), count('book_reader_conversion', cohortFilter),
        count('audio_start', "eventData/source eq 'library'"), count('audio_complete', "eventData/source eq 'library'"),
        count('audio_start', "eventData/source eq 'promo'"), count('audio_complete', "eventData/source eq 'promo'"),
        top('book_view'), top('audio_start', "eventData/source eq 'library'"), top('audio_start', "eventData/source eq 'promo'"),
    ]);
    return { views, readerOpens, conversions, conversionRate: views.data && conversions.data !== null ? conversions.data / views.data * 100 : null, libraryStarts, libraryCompletions, promoStarts, promoCompletions, topBooks, topLibraryAudio, topPromoAudio };
}
export async function checkSetup(client: AnalyticsClient, config: AnalyticsConfig, now = new Date()): Promise<SetupCheck> {
    const missing = missingConfig(config);
    const bounds = { since: new Date(now.getTime() - 86_400_000).toISOString(), until: now.toISOString() };
    const apiResult = await section(async () => traffic(await client.query(bounds, true)));
    const custom = config.customEnabled ? await section(async () => { total(await client.query({ ...bounds, dataset: 'events' }, true), 'count'); return true; }) : 'disabled';
    return { checkedAt: now.toISOString(), configuration: { ok: missing.length === 0, missing }, api: { data: apiResult.data ? true : null, ...(apiResult.error ? { error: apiResult.error } : {}) }, collection: apiResult.data ? apiResult.data.pageviews > 0 ? 'received' : 'unconfirmed' : 'unknown', custom };
}
export async function enrichBookTitles(dashboard: AnalyticsDashboard, lookup: (ids: string[]) => Promise<{ id: string; title: string }[]>): Promise<void> {
    const rows = [dashboard.rankings.readers.data, dashboard.custom?.topBooks.data, dashboard.custom?.topLibraryAudio.data, dashboard.custom?.topPromoAudio.data].flatMap(list => list || []);
    const ids = [...new Set(rows.flatMap(row => row.bookId ? [row.bookId] : []))];
    if (!ids.length) return;
    try {
        const titles = new Map((await lookup(ids)).map(book => [book.id, book.title]));
        for (const row of rows) if (row.bookId) row.name = titles.get(row.bookId) || row.name;
    } catch { dashboard.warnings.push({ code: 'titles' }); }
}
