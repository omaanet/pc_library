'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VercelTrafficChart } from './VercelTrafficChart';
import type { VercelDashboardModel } from '@/hooks/use-vercel-dashboard';
import type { AnalyticsIssue, AnalyticsPeriod, Ranking, Section } from '@/lib/vercel-analytics/types';

export function VercelDashboard({ language, model }: { language: 'it' | 'en'; model: VercelDashboardModel }) {
    const t = (it: string, en: string) => language === 'it' ? it : en;
    const locale = language === 'it' ? 'it-IT' : 'en-GB';
    const number = (value: number | null | undefined) => value == null ? '—' : value.toLocaleString(locale, { maximumFractionDigits: 2 });
    const { data, loading, failed, diagnostic, check, checking, checkFailed, superadmin } = model;
    const issueText = (error: AnalyticsIssue) => {
        const messages = {
            configuration: t('Configurare le variabili server indicate e ridistribuire il sito.', 'Configure the listed server variables and redeploy.'),
            credentials: t('Token Vercel rifiutato. Verificare validità e scadenza.', 'Vercel token rejected. Check validity and expiry.'),
            access: t('Accesso negato. Verificare token, progetto e team.', 'Access denied. Check token, project and team.'),
            unavailable: t('Analytics non disponibile. Verificare il progetto e abilitare Web Analytics in Vercel; controllare il piano.', 'Analytics unavailable. Verify the project, enable Web Analytics in Vercel and check the plan.'),
            rate_limit: t(`Limite API raggiunto. Riprovare tra ${error.retryAfter || 60} secondi.`, `API rate limit reached. Retry in ${error.retryAfter || 60} seconds.`),
            timeout: t('Vercel non ha risposto in tempo. Riprovare.', 'Vercel timed out. Please retry.'),
            upstream: t('Vercel temporaneamente non raggiungibile. Riprovare.', 'Vercel temporarily unavailable. Please retry.'),
            response: t('Risposta Vercel inattesa; verifica non conclusiva.', 'Unexpected Vercel response; check inconclusive.'),
            titles: t('Titoli non disponibili; vengono mostrati gli identificativi.', 'Book titles unavailable; showing identifiers.'),
        };
        return messages[error.code];
    };
    const periodTitle = (p: AnalyticsPeriod) => p === 'today' ? t('Oggi', 'Today') : p === '7d' ? t('Ultimi 7 giorni', 'Last 7 days') : t('Ultimi 30 giorni', 'Last 30 days');
    const empty = t('Nessun dato nel periodo selezionato.', 'No data in the selected period.');
    const renderMetric = (title: string, value: number | null | undefined, error?: AnalyticsIssue, suffix = '') => (
        <Card key={title}><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{number(value)}{value != null ? suffix : ''}</p>{error && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">{issueText(error)}</p>}</CardContent></Card>
    );
    const renderList = (title: string, result: Section<Ranking[]>, dimension?: 'countries' | 'devices' | 'referrers') => {
        const label = (row: Ranking) => {
            if (row.name === 'Others') return t('Altri', 'Others');
            if (row.name === '(unknown)') return dimension === 'referrers' ? t('Diretto / sconosciuto', 'Direct / unknown') : t('Sconosciuto', 'Unknown');
            if (dimension === 'countries' && /^[A-Z]{2}$/i.test(row.name)) { try { return new Intl.DisplayNames([locale], { type: 'region' }).of(row.name.toUpperCase()) || row.name; } catch { return row.name; } }
            if (dimension === 'devices') return ({ desktop: 'Desktop', mobile: t('Cellulare', 'Mobile'), tablet: 'Tablet' } as Record<string, string>)[row.name.toLowerCase()] || row.name;
            return row.name;
        };
        return <Card key={title} className="min-w-0"><CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader><CardContent>
            {result.error && <p className="text-sm text-amber-700 dark:text-amber-300">{issueText(result.error)}</p>}{!result.data ? null : !result.data.length ? <p className="text-sm text-muted-foreground">{empty}</p> : <ol className="space-y-3">{result.data.map((row, index) => <li key={`${row.name}-${index}`} className="flex items-start justify-between gap-3 border-b pb-2 last:border-0"><div className="min-w-0"><p className="break-words text-sm">{label(row)}</p>{row.bookId && row.path && <p className="break-all text-xs text-muted-foreground">{row.path}</p>}<p className="text-xs text-muted-foreground">{number(row.visitors)} {t('visitatori', 'visitors')}</p></div><span className="shrink-0 tabular-nums font-medium">{number(row.value)}</span></li>)}</ol>}
        </CardContent></Card>;
    };
    return <section className="space-y-4" aria-label="Vercel Analytics">
        <div aria-live="polite">
            {superadmin && checking && <p role="status">{t('Verifica in corso…', 'Checking…')}</p>}
            {superadmin && checkFailed && <p role="alert">{t('Verifica non riuscita. Controllare l’accesso e riprovare.', 'Setup check failed. Check access and retry.')}</p>}
            {superadmin && check && <Card><CardHeader><CardTitle>{t('Verifica configurazione', 'Setup check')}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
                <p><strong>{t('Configurazione server', 'Server configuration')}: </strong>{check.configuration.ok ? 'OK' : `${t('Mancano', 'Missing')}: ${check.configuration.missing.join(', ')}`}</p>
                {!check.configuration.ok && <p>{issueText({ code: 'configuration' })}</p>}
                <p><strong>API: </strong>{check.api.data === true ? 'OK' : issueText(check.api.error || { code: 'upstream' })}</p>
                <p><strong>{t('Raccolta recente', 'Recent collection')}: </strong>{check.collection === 'received' ? t('Visualizzazioni ricevute nelle ultime 24 ore.', 'Page views received in the last 24 hours.') : check.collection === 'unconfirmed' ? t('Nessuna visualizzazione nelle ultime 24 ore: raccolta non confermata. Aprire una pagina pubblica in produzione e ripetere la verifica dopo l’acquisizione.', 'No page views in the last 24 hours: collection unconfirmed. Open a public production page and check again after ingestion.') : t('Non verificabile finché l’API non risponde correttamente.', 'Cannot verify until the API responds successfully.')}</p>
                <p><strong>{t('Eventi personalizzati', 'Custom events')}: </strong>{check.custom === 'disabled' ? t('Disabilitati su Hobby.', 'Disabled on Hobby.') : check.custom.data === true ? 'OK' : issueText(check.custom.error || { code: 'upstream' })}</p>
                <p className="text-muted-foreground">{t('L’accesso API non conferma la raccolta da questo browser. Il controllo non invia eventi di prova.', 'API access does not confirm collection from this browser. This check sends no test events.')}</p>
                <p className="text-xs text-muted-foreground">{new Date(check.checkedAt).toLocaleString(locale, { timeZone: 'Europe/Rome' })}</p>
            </CardContent></Card>}
        </div>
        {loading && <p role="status">{t('Caricamento statistiche Vercel…', 'Loading Vercel statistics…')}</p>}
        {superadmin && failed && !diagnostic && <p role="alert">{t('Statistiche non disponibili. Riprovare riaprendo la scheda.', 'Statistics unavailable. Try reopening the tab.')}</p>}
        {superadmin && diagnostic && <Card className="border-destructive" role="alert">
            <CardHeader><CardTitle className="text-base text-destructive">{t('Schema del database non aggiornato', 'Database schema is out of date')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
                <p>{t('La dashboard non riesce a usare una struttura PostgreSQL richiesta. Verificare che tutte le migrazioni previste per questa versione siano state applicate al database collegato.', 'The dashboard cannot use a required PostgreSQL structure. Verify that every migration for this release has been applied to the connected database.')}</p>
                <p><strong>PostgreSQL {diagnostic.code}:</strong> <code className="break-all">{diagnostic.message}</code></p>
                {diagnostic.schema && <p><strong>{t('Schema', 'Schema')}:</strong> <code>{diagnostic.schema}</code></p>}
                {diagnostic.table && <p><strong>{t('Tabella', 'Table')}:</strong> <code>{diagnostic.table}</code></p>}
                {diagnostic.column && <p><strong>{t('Colonna', 'Column')}:</strong> <code>{diagnostic.column}</code></p>}
                {diagnostic.detail && <p><strong>{t('Dettaglio', 'Detail')}:</strong> {diagnostic.detail}</p>}
                {diagnostic.hint && <p><strong>{t('Suggerimento PostgreSQL', 'PostgreSQL hint')}:</strong> {diagnostic.hint}</p>}
                {diagnostic.message.includes('vercel_analytics_cache_') && <p>{t('Per la cache Vercel, applicare la migrazione', 'For the Vercel cache, apply migration')} <code>scripts/migrations/20260909_vercel_analytics_cache.sql</code>, {t('quindi riprovare.', 'then try again.')}</p>}
            </CardContent>
        </Card>}
        {data && <>
            {data.missing.length > 0 && <p role="alert" className="rounded-md border border-amber-500 p-3 text-sm">{t('Configurazione mancante', 'Missing configuration')}: {data.missing.join(', ')}. {superadmin ? t('Usare Verifica configurazione per i dettagli.', 'Use Check setup for details.') : t('Contattare un superadmin.', 'Contact a superadmin.')}</p>}
            {data.warnings.map((warning, i) => <p key={i} className="text-sm text-amber-700 dark:text-amber-300">{issueText(warning)}</p>)}
            <VercelTrafficChart data={data} language={language} />
            <div className="grid gap-4 sm:grid-cols-3">{(['today', '7d', '30d'] as const).map(p => <Card key={p}><CardHeader><CardTitle className="text-base">{periodTitle(p)}</CardTitle></CardHeader><CardContent>{data.summaries[p].error && <p className="text-sm">{issueText(data.summaries[p].error!)}</p>}{data.summaries[p].data && <><p>{number(data.summaries[p].data?.visitors)} {t('visitatori', 'visitors')}</p><p className="text-sm text-muted-foreground">{number(data.summaries[p].data?.pageviews)} {t('visualizzazioni', 'page views')}</p></>}</CardContent></Card>)}</div>
            {data.daily.some(day => day.error) && <p className="text-sm text-amber-700 dark:text-amber-300">{t('Alcuni giorni non sono disponibili; le interruzioni nel grafico non indicano zero visite.', 'Some days are unavailable; gaps in the chart do not mean zero visits.')} {issueText(data.daily.find(day => day.error)!.error!)}</p>}
            <div className="grid gap-4 lg:grid-cols-2">{renderList(t('Pagine più viste', 'Top pages'), data.rankings.pages)}{renderList(t('Principali provenienze', 'Top referrers'), data.rankings.referrers, 'referrers')}{renderList(t('Paesi', 'Countries'), data.rankings.countries, 'countries')}{renderList(t('Dispositivi', 'Devices'), data.rankings.devices, 'devices')}{renderList(t('Pagine lettore più aperte · include link diretti', 'Top reader routes · includes direct links'), data.rankings.readers)}</div>
            <Card><CardHeader><CardTitle>{t('Libri e audio', 'Books and audio')}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{data.customEnabled ? t('Dati raccolti dall’attivazione degli eventi. Completamento audio: almeno il 50% ascoltato nella stessa sessione del lettore audio. Le visite dirette al lettore sono incluse nelle aperture; le conversioni richiedono una scheda libro precedente entro 30 minuti.', 'Data collected since events were enabled. Audio completion: at least 50% listened in the same audio-player session. Direct reader visits count as opens; conversions require a preceding book detail within 30 minutes.') : t('Eventi personalizzati disabilitati su Hobby. Dopo l’upgrade a Pro o Enterprise, abilitare gli eventi nella configurazione e ridistribuire. Le nuove metriche partiranno dall’attivazione; non sono disponibili dati storici.', 'Custom events disabled on Hobby. After upgrading to Pro or Enterprise, enable custom events in configuration and redeploy. New metrics begin at enablement; historical data is unavailable.')}</CardContent></Card>
            {data.custom && <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{renderMetric(t('Schede libro aperte', 'Book details opened'), data.custom.views.data, data.custom.views.error)}{renderMetric(t('Aperture lettore riuscite', 'Successful reader opens'), data.custom.readerOpens.data, data.custom.readerOpens.error)}{renderMetric(t('Libro → Lettore', 'Book → Reader'), data.custom.conversions.data, data.custom.conversions.error)}{renderMetric(t('Tasso di conversione', 'Conversion rate'), data.custom.conversionRate, data.custom.views.error || data.custom.conversions.error, '%')}{renderMetric(t('Avvii audio · Libreria', 'Audio starts · Library'), data.custom.libraryStarts.data, data.custom.libraryStarts.error)}{renderMetric(t('Completamenti ≥50% · Libreria', 'Completions ≥50% · Library'), data.custom.libraryCompletions.data, data.custom.libraryCompletions.error)}{renderMetric(t('Avvii audio · Promo', 'Audio starts · Promo'), data.custom.promoStarts.data, data.custom.promoStarts.error)}{renderMetric(t('Completamenti ≥50% · Promo', 'Completions ≥50% · Promo'), data.custom.promoCompletions.data, data.custom.promoCompletions.error)}</div>
                <div className="grid gap-4 lg:grid-cols-2">{renderList(t('Libri più visti', 'Most viewed books'), data.custom.topBooks)}{renderList(t('Libri più ascoltati · Libreria (avvii)', 'Most listened books · Library (starts)'), data.custom.topLibraryAudio)}{renderList(t('Libri più ascoltati · Promo (avvii)', 'Most listened books · Promo (starts)'), data.custom.topPromoAudio)}</div>
            </>}
        </>}
    </section>;
}
