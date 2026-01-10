// src/hooks/use-user-preferences.ts
/**
 * @deprecated This hook has been replaced by Zustand store.
 * Please use the hooks from '@/stores/preferences-store' instead:
 * - useViewMode()
 * - useLanguage()
 * - useReadingPreferences()
 * - useAccessibilityPreferences()
 * - usePreferencesStore() for actions
 * 
 * Migration guide:
 * - Theme: Use useTheme() from 'next-themes'
 * - Other preferences: Use Zustand selectors and actions
 */

// Keeping this file for backward compatibility during migration
// This file can be safely removed after confirming no components use it

export function useUserPreferences() {
    throw new Error(
        'useUserPreferences is deprecated. Please use Zustand store from @/stores/preferences-store instead.'
    );
}