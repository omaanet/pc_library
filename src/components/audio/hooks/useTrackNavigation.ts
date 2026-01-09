// src/components/audio/hooks/useTrackNavigation.ts
// Track navigation logic

import { useState } from 'react';
import type { Track } from '../types';

interface UseTrackNavigationProps {
    tracks: Track[];
    onTrackChange?: (trackIndex: number) => void;
}

interface UseTrackNavigationReturn {
    currentTrack: number;
    setCurrentTrack: (index: number) => void;
    handleNext: () => void;
    handlePrev: () => void;
    handleEnd: () => void;
}

/**
 * Custom hook for managing track navigation
 */
export function useTrackNavigation({ tracks, onTrackChange }: UseTrackNavigationProps): UseTrackNavigationReturn {
    const [currentTrack, setCurrentTrackState] = useState<number>(0);

    const setCurrentTrack = (index: number) => {
        setCurrentTrackState(index);
        onTrackChange?.(index);
    };

    const handleEnd = (): void => {
        if (tracks.length <= 1 || currentTrack >= tracks.length - 1) return;
        const nextTrack = currentTrack + 1;
        setCurrentTrack(nextTrack);
    };

    const handleNext = (): void => {
        if (tracks.length <= 1 || currentTrack >= tracks.length - 1) return;
        const nextTrack = currentTrack + 1;
        setCurrentTrack(nextTrack);
    };

    const handlePrev = (): void => {
        if (tracks.length <= 1 || currentTrack <= 0) return;
        const prevTrack = currentTrack - 1;
        setCurrentTrack(prevTrack);
    };

    return {
        currentTrack,
        setCurrentTrack,
        handleNext,
        handlePrev,
        handleEnd
    };
}
