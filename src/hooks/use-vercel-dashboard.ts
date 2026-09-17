'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnalyticsDashboard, AnalyticsLimit, AnalyticsPeriod, DatabaseSchemaDiagnostic, SetupCheck } from '@/lib/vercel-analytics/types';

export function useVercelDashboard(active: boolean, superadmin: boolean) {
    const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
    const [limit, setLimit] = useState<AnalyticsLimit>(10);
    const [data, setData] = useState<AnalyticsDashboard | null>(null);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [diagnostic, setDiagnostic] = useState<DatabaseSchemaDiagnostic | null>(null);
    const [check, setCheck] = useState<SetupCheck | null>(null);
    const [checking, setChecking] = useState(false);
    const [checkFailed, setCheckFailed] = useState(false);
    const controller = useRef<AbortController | null>(null);
    const checkController = useRef<AbortController | null>(null);
    const load = useCallback(async (refresh = false) => {
        if (!active || (refresh && !superadmin)) return;
        controller.current?.abort();
        const next = new AbortController(); controller.current = next;
        setLoading(true); setFailed(false); setDiagnostic(null);
        if (!refresh) setData(null);
        try {
            const headers: Record<string, string> = {};
            if (refresh) {
                const csrf = await fetch('/api/csrf-token', { signal: next.signal, cache: 'no-store' });
                if (!csrf.ok) throw new Error('csrf');
                headers['x-csrf-token'] = (await csrf.json()).token;
            }
            const response = await fetch(`/api/admin/analytics${refresh ? '/refresh' : ''}?period=${period}&limit=${limit}`, {
                method: refresh ? 'POST' : 'GET', headers, signal: next.signal, cache: 'no-store',
            });
            if (!response.ok) {
                if (superadmin) {
                    try {
                        const problem = await response.json() as { diagnostic?: DatabaseSchemaDiagnostic };
                        if (problem.diagnostic?.kind === 'database_schema') setDiagnostic(problem.diagnostic);
                    } catch { /* Keep the normal generic failure for invalid responses. */ }
                }
                throw new Error('request');
            }
            const value = await response.json() as AnalyticsDashboard;
            if (!next.signal.aborted) setData(value);
        } catch {
            if (!next.signal.aborted) {
                setFailed(true);
                if (refresh) setData(previous => previous ? { ...previous, cache: { expiresAt: previous.cache?.expiresAt || previous.updatedAt, stale: true } } : previous);
            }
        }
        finally { if (!next.signal.aborted) setLoading(false); }
    }, [active, superadmin, period, limit]);
    useEffect(() => { void load(); return () => controller.current?.abort(); }, [load]);
    useEffect(() => {
        if (!active || !superadmin) { checkController.current?.abort(); setCheck(null); setChecking(false); setCheckFailed(false); }
        return () => checkController.current?.abort();
    }, [active, superadmin]);
    const runCheck = async () => {
        if (!active || !superadmin) return;
        checkController.current?.abort();
        const next = new AbortController(); checkController.current = next;
        setChecking(true); setCheckFailed(false); setCheck(null); setDiagnostic(null);
        try {
            const response = await fetch('/api/admin/analytics/check', { signal: next.signal, cache: 'no-store' });
            if (!response.ok) {
                try {
                    const problem = await response.json() as { diagnostic?: DatabaseSchemaDiagnostic };
                    if (problem.diagnostic?.kind === 'database_schema') setDiagnostic(problem.diagnostic);
                } catch { /* Keep the normal generic failure for invalid responses. */ }
                throw new Error('request');
            }
            const value = await response.json() as SetupCheck;
            if (!next.signal.aborted) setCheck(value);
        } catch { if (!next.signal.aborted) setCheckFailed(true); }
        finally { if (!next.signal.aborted) setChecking(false); }
    };
    return { period, setPeriod, limit, setLimit, data, loading, failed, diagnostic, check, checking, checkFailed, load, runCheck, superadmin };
}
export type VercelDashboardModel = ReturnType<typeof useVercelDashboard>;
