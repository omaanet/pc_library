// src/components/audio/hooks/useTrackNavigation.ts
// Track navigation logic

import { useCallback, useEffect, useState } from 'react';
import type { Track } from '../types';

interface UseTrackNavigationProps {
    tracks: Track[];
    initialTrackIndex?: number;
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
export function useTrackNavigation({ tracks, initialTrackIndex = 0, onTrackChange }: UseTrackNavigationProps): UseTrackNavigationReturn {
    const getClampedTrack = useCallback((index: number) => {
        if (tracks.length <= 0) return 0;
        return Math.max(0, Math.min(tracks.length - 1, index));
    }, [tracks.length]);
    const [currentTrack, setCurrentTrackState] = useState<number>(getClampedTrack(initialTrackIndex));

    useEffect(() => {
        setCurrentTrackState(getClampedTrack(initialTrackIndex));
    }, [getClampedTrack, initialTrackIndex, tracks.length]);

    const setCurrentTrack = (index: number) => {
        const nextTrack = getClampedTrack(index);
        setCurrentTrackState(nextTrack);
        onTrackChange?.(nextTrack);
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
