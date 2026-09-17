-- Apply before deploying the shared analytics cache. Only aggregate metrics, never credentials or individual events.
CREATE TABLE IF NOT EXISTS vercel_analytics_cache_scopes (
    namespace TEXT PRIMARY KEY,
    generation BIGINT NOT NULL DEFAULT 0,
    lease_owner TEXT,
    lease_until TIMESTAMPTZ,
    retry_until TIMESTAMPTZ,
    retry_issue JSONB
);
CREATE TABLE IF NOT EXISTS vercel_analytics_cache_entries (
    namespace TEXT NOT NULL REFERENCES vercel_analytics_cache_scopes(namespace) ON DELETE CASCADE,
    cache_key TEXT NOT NULL,
    generation BIGINT NOT NULL,
    payload JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (namespace, cache_key)
);
