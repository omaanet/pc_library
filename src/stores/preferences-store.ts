// src/stores/preferences-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types for our preferences
export interface ReadingPreferences {
    fontSize: number;
    lineHeight: 'tight' | 'normal' | 'relaxed';
    fontFamily: string;
}

// Reader-specific preferences for the book reading page
export interface ReaderPreferences {
    viewMode: 'single' | 'double';
    zoomLevel: number;
}

export interface AccessibilityPreferences {
    reduceAnimations: boolean;
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
}

export interface PreferencesState {
    // Appearance (excluding theme - handled by next-themes)
    viewMode: 'grid' | 'list' | 'detailed';
    language: string;
    
    // Reading
    reading: ReadingPreferences;
    
    // Reader (for book reading page)
    reader: ReaderPreferences;
    
    // Accessibility
    accessibility: AccessibilityPreferences;
    
    // Actions
    setViewMode: (mode: 'grid' | 'list' | 'detailed') => void;
    setLanguage: (lang: string) => void;
    updateReadingPrefs: (prefs: Partial<ReadingPreferences>) => void;
    updateReaderPrefs: (prefs: Partial<ReaderPreferences>) => void;
    updateAccessibilityPrefs: (prefs: Partial<AccessibilityPreferences>) => void;
    resetPreferences: () => void;
}

// Default values
const defaultReadingPreferences: ReadingPreferences = {
    fontSize: 100,
    lineHeight: 'normal',
    fontFamily: 'default',
};

const defaultReaderPreferences: ReaderPreferences = {
    viewMode: 'double',
    zoomLevel: 100,
};

const defaultAccessibilityPreferences: AccessibilityPreferences = {
    reduceAnimations: false,
    highContrast: false,
    largeText: false,
    reducedMotion: false,
};

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        immer((set, get) => ({
            // Initial state
            viewMode: 'grid',
            language: 'it',
            reading: defaultReadingPreferences,
            reader: defaultReaderPreferences,
            accessibility: defaultAccessibilityPreferences,
            
            // Actions
            setViewMode: (mode) => {
                set((state) => {
                    state.viewMode = mode;
                });
            },
            
            setLanguage: (lang) => {
                set((state) => {
                    state.language = lang;
                });
            },
            
            updateReadingPrefs: (prefs) => {
                set((state) => {
                    state.reading = { ...state.reading, ...prefs };
                });
            },
            
            updateReaderPrefs: (prefs) => {
                set((state) => {
                    state.reader = { ...state.reader, ...prefs };
                });
            },
            
            updateAccessibilityPrefs: (prefs) => {
                set((state) => {
                    state.accessibility = { ...state.accessibility, ...prefs };
                });
            },
            
            resetPreferences: () => {
                set((state) => {
                    state.viewMode = 'grid';
                    state.language = 'it';
                    state.reading = defaultReadingPreferences;
                    state.reader = defaultReaderPreferences;
                    state.accessibility = defaultAccessibilityPreferences;
                });
            },
        })),
        {
            name: 'user-preferences',
            storage: createJSONStorage(() => localStorage),
            // Only persist these parts of the state
            partialize: (state) => ({
                viewMode: state.viewMode,
                language: state.language,
                reading: state.reading,
                reader: state.reader,
                accessibility: state.accessibility,
            }),
            version: 1,
            // Migration function for future schema changes
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    // Migrate from version 0 to 1
                    return {
                        ...persistedState,
                        accessibility: defaultAccessibilityPreferences,
                        reader: defaultReaderPreferences,
                    };
                }
                return persistedState as PreferencesState;
            },
        }
    )
);

// Selector hooks for better performance
export const useViewMode = () => usePreferencesStore((state) => state.viewMode);
export const useLanguage = () => usePreferencesStore((state) => state.language);
export const useReadingPreferences = () => usePreferencesStore((state) => state.reading);
export const useReaderPreferences = () => usePreferencesStore((state) => state.reader);
export const useAccessibilityPreferences = () => usePreferencesStore((state) => state.accessibility);
