'use client';
import { useId, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AnalyticsDashboard, Traffic } from '@/lib/vercel-analytics/types';

export function VercelTrafficChart({ data, language }: { data: AnalyticsDashboard; language: 'it' | 'en' }) {
    const [metric, setMetric] = useState<keyof Traffic>('visitors');
    const id = useId().replace(/:/g, '');
    const locale = language === 'it' ? 'it-IT' : 'en-GB';
    const labels = language === 'it' ? { visitors: 'Visitatori', pageviews: 'Visualizzazioni', pagesPerVisitor: 'Pagine / visitatore' } : { visitors: 'Visitors', pageviews: 'Page Views', pagesPerVisitor: 'Pages / Visitor' };
    const format = (value: number | null | undefined) => value == null ? '—' : value.toLocaleString(locale, { maximumFractionDigits: metric === 'pagesPerVisitor' ? 2 : 0 });
    const selected = data.summaries[data.period];
    const rows = data.daily.map((day, index, days) => {
        const value = metric === 'pagesPerVisitor' ? day.visitors && day.pageviews != null ? day.pageviews / day.visitors : null : day[metric];
        return { date: day.date, complete: index < days.length - 1 ? value : null, partial: index >= days.length - 2 ? value : null };
    });
    return <div className="overflow-hidden rounded-xl border bg-card text-card-foreground">
        <div className="grid grid-cols-3 border-b sm:flex" role="group" aria-label={language === 'it' ? 'Metrica del grafico' : 'Chart metric'}>
            {(Object.keys(labels) as (keyof Traffic)[]).map(key => <button type="button" key={key} aria-pressed={metric === key} onClick={() => setMetric(key)} className={`min-w-0 border-r px-3 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 sm:w-[220px] sm:px-5 ${metric === key ? 'border-b-2 border-b-foreground bg-muted/30' : 'border-b-2 border-b-transparent'}`}>
                <span className="block text-xs font-medium text-muted-foreground sm:text-sm">{labels[key]}</span>
                <span className="mt-2 block text-xl font-semibold tabular-nums sm:text-3xl">{selected.data?.[key] == null ? '—' : selected.data[key]?.toLocaleString(locale, { maximumFractionDigits: key === 'pagesPerVisitor' ? 2 : 0 })}</span>
            </button>)}
        </div>
        <div className="h-[280px] w-full px-2 pb-3 pt-8 sm:h-[390px] sm:px-5" role="img" aria-label={`${labels[metric]} — ${language === 'it' ? 'traffico giornaliero; oggi è parziale' : 'daily traffic; today is partial'}`}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: -15 }}>
                    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0070f3" stopOpacity={0.16} /><stop offset="100%" stopColor="#0070f3" stopOpacity={0.03} /></linearGradient></defs>
                    <CartesianGrid vertical={false} stroke="currentColor" className="text-border" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} minTickGap={25} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={value => new Date(`${value}T12:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'Europe/Rome' })} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={metric === 'pagesPerVisitor'} domain={[0, 'auto']} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={format} />
                    <Tooltip content={({ active, payload, label }) => {
                        const point = payload?.find(item => item.value != null);
                        return active && point ? <div className="rounded-md border bg-popover p-3 text-sm text-popover-foreground shadow-md"><p>{new Date(`${label}T12:00:00Z`).toLocaleDateString(locale)}</p><p>{labels[metric]}: {format(Number(point.value))}</p></div> : null;
                    }} />
                    <Area type="linear" dataKey="complete" stroke="#0070f3" strokeWidth={2} fill={`url(#${id})`} connectNulls={false} isAnimationActive={false} />
                    <Area type="linear" dataKey="partial" stroke="#0070f3" strokeWidth={2} strokeDasharray="5 5" fill={`url(#${id})`} connectNulls={false} isAnimationActive={false} dot={rows.length === 1 ? { r: 3 } : false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>;
}
