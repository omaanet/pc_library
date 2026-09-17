export const STATISTICS_TABS = ['vercel', 'overview', 'downloads', 'reading', 'audio', 'promo', 'users', 'errors'] as const;
export type StatisticsTab = typeof STATISTICS_TABS[number];
// A new key intentionally ignores the pre-Vercel selection once per browser.
export const TAB_STORAGE_KEY = 'user-statistics-active-tab-v2';
export function initialStatisticsTab(storage: Pick<Storage, 'getItem' | 'setItem'>): StatisticsTab {
    try {
        const saved = storage.getItem(TAB_STORAGE_KEY);
        if (STATISTICS_TABS.includes(saved as StatisticsTab)) return saved as StatisticsTab;
        storage.setItem(TAB_STORAGE_KEY, 'vercel');
    } catch { /* Storage is optional. */ }
    return 'vercel';
}
