'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { toast } from '@/components/ui/use-toast';
import { BookBadgePaletteProvider } from './book-badge-palette-provider';
import {
    selectUserPreferences,
    useReaderPreferencesStore,
    useThemePreference,
} from '@/stores/preferences-store';
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '@/types/preferences';

const SAVE_DELAY_MS = 350;
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
    const { state: { user }, updatePreferences } = useAuth();
    const theme = useThemePreference();
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRef = React.useRef<UserPreferences | null>(null);
    const savingRef = React.useRef(false);
    const retryBlockedRef = React.useRef(false);
    const hydratingRef = React.useRef(false);
    const activeUserIdRef = React.useRef<number | null>(user?.id ?? null);

    const clearTimer = React.useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const flushPending = React.useCallback(async (): Promise<void> => {
        if (savingRef.current || retryBlockedRef.current || !pendingRef.current) return;

        const snapshot = pendingRef.current;
        const userId = activeUserIdRef.current;
        pendingRef.current = null;
        savingRef.current = true;

        try {
            await updatePreferences(snapshot);
        } catch (error) {
            console.error('Failed to save user preferences:', error);
            if (activeUserIdRef.current === userId) {
                if (!pendingRef.current) pendingRef.current = snapshot;
                retryBlockedRef.current = true;
                toast({
                    title: 'Errore di salvataggio',
                    description: 'Le preferenze restano applicate e verranno salvate al prossimo tentativo.',
                    variant: 'destructive',
                });
            }
        } finally {
            savingRef.current = false;
            if (pendingRef.current && !retryBlockedRef.current) {
                clearTimer();
                timerRef.current = setTimeout(() => void flushPending(), SAVE_DELAY_MS);
            }
        }
    }, [clearTimer, updatePreferences]);

    useIsomorphicLayoutEffect(() => {
        activeUserIdRef.current = user?.id ?? null;
        clearTimer();
        pendingRef.current = null;
        retryBlockedRef.current = false;

        hydratingRef.current = true;
        if (user) {
            useReaderPreferencesStore.getState().hydrateForUser(
                user.id,
                user.preferences ?? { ...DEFAULT_USER_PREFERENCES }
            );
        } else {
            useReaderPreferencesStore.getState().resetToDefaults();
        }
        hydratingRef.current = false;
    }, [clearTimer, user?.id]);

    const serverPreferencesKey = JSON.stringify(user?.preferences ?? null);
    React.useEffect(() => {
        if (!user || pendingRef.current || savingRef.current) return;

        hydratingRef.current = true;
        useReaderPreferencesStore.getState().hydrateForUser(
            user.id,
            user.preferences ?? { ...DEFAULT_USER_PREFERENCES }
        );
        hydratingRef.current = false;
    }, [serverPreferencesKey, user]);

    React.useEffect(() => {
        try {
            localStorage.removeItem('reader-preferences');
            localStorage.removeItem('theme');
        } catch {
            // Storage can be unavailable in privacy-restricted browser contexts.
        }

        return useReaderPreferencesStore.subscribe((state, previousState) => {
            if (hydratingRef.current || !activeUserIdRef.current) return;

            const next = selectUserPreferences(state);
            const previous = selectUserPreferences(previousState);
            if (JSON.stringify(next) === JSON.stringify(previous)) return;

            pendingRef.current = next;
            retryBlockedRef.current = false;
            clearTimer();
            timerRef.current = setTimeout(() => void flushPending(), SAVE_DELAY_MS);
        });
    }, [clearTimer, flushPending]);

    React.useEffect(() => {
        const retry = () => {
            if (!pendingRef.current) return;
            retryBlockedRef.current = false;
            void flushPending();
        };
        window.addEventListener('online', retry);
        return () => window.removeEventListener('online', retry);
    }, [flushPending]);

    React.useEffect(() => () => clearTimer(), [clearTimer]);

    return (
        <ThemeProvider attribute="class" forcedTheme={theme} enableSystem disableTransitionOnChange>
            <BookBadgePaletteProvider>{children}</BookBadgePaletteProvider>
        </ThemeProvider>
    );
}
