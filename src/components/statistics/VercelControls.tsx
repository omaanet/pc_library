'use client';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { VercelDashboardModel } from '@/hooks/use-vercel-dashboard';
import type { AnalyticsLimit, AnalyticsPeriod } from '@/lib/vercel-analytics/types';

export function VercelControls({ model, language }: { model: VercelDashboardModel; language: 'it' | 'en' }) {
    const t = (it: string, en: string) => language === 'it' ? it : en;
    const { period, setPeriod, limit, setLimit, data, loading, checking, load, runCheck, superadmin } = model;
    return <>
        <Select value={period} onValueChange={value => setPeriod(value as AnalyticsPeriod)}>
            <SelectTrigger aria-label={t('Periodo', 'Period')} className="w-[165px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="today">{t('Oggi', 'Today')}</SelectItem><SelectItem value="7d">{t('Ultimi 7 giorni', 'Last 7 days')}</SelectItem><SelectItem value="30d">{t('Ultimi 30 giorni', 'Last 30 days')}</SelectItem></SelectContent>
        </Select>
        <Select value={String(limit)} onValueChange={value => setLimit(Number(value) as AnalyticsLimit)}>
            <SelectTrigger aria-label="Top" className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>{[5, 10, 50].map(value => <SelectItem key={value} value={String(value)}>Top {value}</SelectItem>)}</SelectContent>
        </Select>
        {superadmin && <>
            <Button variant="outline" size="icon" title={t('Aggiorna', 'Refresh')} aria-label={t('Aggiorna', 'Refresh')} disabled={loading} onClick={() => void load(true)}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
            <Button variant="outline" size="icon" title={t('Verifica configurazione', 'Check setup')} aria-label={checking ? t('Verifica in corso…', 'Checking…') : t('Verifica configurazione', 'Check setup')} disabled={checking} onClick={() => void runCheck()}><CheckCircle2 className={`h-4 w-4 ${checking ? 'animate-pulse' : ''}`} /></Button>
        </>}
        <p className="basis-full text-xs text-muted-foreground sm:text-right" aria-live="polite">
            {t('Produzione · Europe/Rome · Cache condivisa · 10 minuti', 'Production · Europe/Rome · Shared cache · 10 minutes')}
            {data && ` · ${new Date(data.updatedAt).toLocaleString(language === 'it' ? 'it-IT' : 'en-GB', { timeZone: 'Europe/Rome' })}`}
            {data?.cache?.stale && <span className="text-amber-700 dark:text-amber-300"> · {t('Dati non aggiornati', 'Stale data')}</span>}
        </p>
    </>;
}
