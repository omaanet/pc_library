// src/components/audio/types.ts
// Type definitions for audio player

/**
 * Audio track information
 */
export interface Track {
    title: string;
    url: string;
}

/**
 * Props for the HTML5Player component
 */
export interface HTML5PlayerProps {
    tracks: Track[];
    autoPlay?: boolean;
    initialVolume?: number; // percent, 0-100
}
