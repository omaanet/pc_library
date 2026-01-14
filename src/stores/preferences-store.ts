// src/stores/preferences-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Reader-specific preferences for the book reading page
export interface ReaderPreferences {
    viewMode: 'single' | 'double';
    zoomLevel: number;
}

export interface ReaderPreferencesState {
    // Reader preferences
    reader: ReaderPreferences;
    
    // Actions
    setViewMode: (mode: 'single' | 'double') => void;
    setZoomLevel: (level: number) => void;
    resetToDefaults: () => void;
}

// Default values
const defaultReaderPreferences: ReaderPreferences = {
    viewMode: 'double',
    zoomLevel: 1.0, // Use 1.0 for 100% zoom
};

export const useReaderPreferencesStore = create<ReaderPreferencesState>()(
    persist(
        (set) => ({
            // Initial state
            reader: defaultReaderPreferences,
            
            // Actions
            setViewMode: (mode) => {
                set((state) => ({
                    reader: { ...state.reader, viewMode: mode }
                }));
            },
            
            setZoomLevel: (level) => {
                set((state) => ({
                    reader: { ...state.reader, zoomLevel: level }
                }));
            },
            
            resetToDefaults: () => {
                set({ reader: defaultReaderPreferences });
            },
        }),
        {
            name: 'reader-preferences',
            storage: createJSONStorage(() => localStorage),
            version: 1,
        }
    )
);

// Selector hooks for better performance
export const useReaderPreferences = () => useReaderPreferencesStore((state) => state.reader);
export const useSetViewMode = () => useReaderPreferencesStore((state) => state.setViewMode);
export const useSetZoomLevel = () => useReaderPreferencesStore((state) => state.setZoomLevel);
