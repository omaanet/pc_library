export type AnalyticsPeriod = 'today' | '7d' | '30d';
export type AnalyticsLimit = 5 | 10 | 50;
export type IssueCode = 'configuration' | 'credentials' | 'access' | 'unavailable' | 'rate_limit' | 'timeout' | 'upstream' | 'response' | 'titles';
export interface AnalyticsIssue { code: IssueCode; retryAfter?: number }
export interface Section<T> { data: T | null; error?: AnalyticsIssue }
export interface Traffic { pageviews: number; visitors: number; pagesPerVisitor: number | null }
export interface Ranking { name: string; value: number; visitors: number; bookId?: string; path?: string }
export interface DateBounds { since: string; until: string; dates: string[] }
export interface CustomMetrics {
    views: Section<number>;
    readerOpens: Section<number>;
    conversions: Section<number>;
    conversionRate: number | null;
    libraryStarts: Section<number>;
    libraryCompletions: Section<number>;
    promoStarts: Section<number>;
    promoCompletions: Section<number>;
    topBooks: Section<Ranking[]>;
    topLibraryAudio: Section<Ranking[]>;
    topPromoAudio: Section<Ranking[]>;
}
export interface AnalyticsDashboard {
    period: AnalyticsPeriod;
    timezone: 'Europe/Rome';
    bounds: DateBounds;
    updatedAt: string;
    cache?: { expiresAt: string; stale: boolean; retryAfter?: number };
    missing: string[];
    summaries: Record<AnalyticsPeriod, Section<Traffic>>;
    daily: { date: string; pageviews: number | null; visitors: number | null; error?: AnalyticsIssue }[];
    rankings: Record<'pages' | 'referrers' | 'countries' | 'devices' | 'readers', Section<Ranking[]>>;
    customEnabled: boolean;
    custom: CustomMetrics | null;
    warnings: AnalyticsIssue[];
}
export interface SetupCheck {
    checkedAt: string;
    configuration: { ok: boolean; missing: string[] };
    api: Section<boolean>;
    collection: 'received' | 'unconfirmed' | 'unknown';
    custom: Section<boolean> | 'disabled';
}

export interface DatabaseSchemaDiagnostic {
    kind: 'database_schema';
    code: string;
    message: string;
    detail?: string;
    hint?: string;
    schema?: string;
    table?: string;
    column?: string;
}
