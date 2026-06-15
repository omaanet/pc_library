// src/components/audio/types.ts
// Type definitions for audio player

/**
 * Audio track information
 */
export interface Track {
    title: string;
    url: string;
    kind?: 'intro' | 'main';
}

export type AudioResumeStatus = 'idle' | 'pending' | 'applied' | 'skipped' | 'failed';

export interface AudioPlayerState {
    currentTrack: number;
    track: Track;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    resumeStatus: AudioResumeStatus;
}

/**
 * Props for the HTML5Player component
 */
export interface HTML5PlayerProps {
    tracks: Track[];
    autoPlay?: boolean;
    initialVolume?: number; // percent, 0-100
    initialTrackIndex?: number;
    initialTime?: number;
    onProgress?: (state: AudioPlayerState) => void;
    onFirstPlay?: (state: AudioPlayerState) => void;
    onBookmark?: (state: AudioPlayerState) => void;
    isBookmarkActive?: (state: AudioPlayerState) => boolean;
    isBookmarkSaving?: boolean;
    showBookmarkControl?: boolean;
    isBookmarkDisabled?: boolean;
}
