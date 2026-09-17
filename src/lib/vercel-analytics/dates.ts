import type { AnalyticsPeriod, DateBounds } from './types';

export const TIMEZONE = 'Europe/Rome' as const;
const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
export function romeDate(date: Date): string {
    const parts = dateFormatter.formatToParts(date);
    return ['year', 'month', 'day'].map(key => parts.find(p => p.type === key)!.value).join('-');
}
export function shiftDate(date: string, days: number): string {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
}
export function romeMidnight(date: string): Date {
    // Rome midnight is unambiguous even on DST transition days.
    const utc = Date.parse(`${date}T00:00:00Z`);
    const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, hour: '2-digit', hourCycle: 'h23' }).format(new Date(utc)));
    return new Date(utc - hour * 3_600_000);
}
export function periodBounds(period: AnalyticsPeriod, now: Date): DateBounds {
    const days = period === 'today' ? 1 : period === '7d' ? 7 : 30;
    const today = romeDate(now);
    const dates = Array.from({ length: days }, (_, i) => shiftDate(today, i - days + 1));
    return { since: romeMidnight(dates[0]).toISOString(), until: now.toISOString(), dates };
}
export function dayBounds(date: string, now: Date): DateBounds {
    return { since: romeMidnight(date).toISOString(), until: new Date(Math.min(now.getTime(), romeMidnight(shiftDate(date, 1)).getTime() - 1)).toISOString(), dates: [date] };
}
