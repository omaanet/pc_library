// src/hooks/use-user-preferences.ts
/**
 * Custom hook for managing user preferences.
 * 
 * State Flow:
 * 1. Auth context updates user.preferences via API call
 * 2. useEffect (lines 54-66) syncs from user.preferences to local state
 * 3. Local state provides defaults and stable reference for components
 * 
 * The local preferences state is necessary to:
 * - Provide default values when user is not authenticated
 * - Build updated preferences objects for API calls
 * - Prevent unnecessary re-renders with stable reference
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTheme } from 'next-themes';
import type { UserPreferences } from '@/types';

export interface UseUserPreferencesResult {
    preferences: UserPreferences;
    isLoading: boolean;
    error: Error | null;
    updatePreference: <K extends keyof UserPreferences>(
        key: K,
        value: UserPreferences[K]
    ) => Promise<void>;
    syncPreferences: () => Promise<void>;
}

export function useUserPreferences(): UseUserPreferencesResult {
    const { state: { user }, updatePreferences } = useAuth();
    const { setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const defaultPreferences: UserPreferences = {
        theme: 'system',
        viewMode: 'grid',
        language: 'it',
        fontSize: 100,
        notifications: {
            email: false,
            push: false,
            SMS: false
        },
        emailNotifications: {
            newReleases: false,
            readingReminders: false,
            recommendations: false
        },
        accessibility: {
            reduceAnimations: false,
            highContrast: false,
            largeText: false,
            reducedMotion: false
        },
        reading: {
            fontSize: 100,
            lineHeight: 'normal',
            fontFamily: 'default'
        },
        lastUpdated: new Date()
    };
    const [preferences, setPreferences] = useState(defaultPreferences);

    // Initialize preferences from user data
    useEffect(() => {
        if (user?.preferences) {
            setPreferences(prevPrefs => ({
                ...prevPrefs,
                ...user.preferences,
            }));

            // Sync theme with user preference
            if (user.preferences.theme) {
                setTheme(user.preferences.theme);
            }
        }
    }, [user, setTheme]);

    // Update a single preference
    const updatePreference = useCallback(async <K extends keyof UserPreferences>(
        key: K,
        value: UserPreferences[K]
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            const updatedPreferences = {
                ...preferences,
                [key]: value,
            };

            // updatePreferences from auth context handles both API call and state update
            await updatePreferences(updatedPreferences);

            // Special handling for theme changes
            if (key === 'theme') {
                setTheme(value as string);
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to update preferences'));
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [preferences, updatePreferences, setTheme]);

    // Sync all preferences with the server
    const syncPreferences = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            await updatePreferences(preferences);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to sync preferences'));
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [preferences, updatePreferences]);

    return {
        preferences,
        isLoading,
        error,
        updatePreference,
        syncPreferences,
    };
}